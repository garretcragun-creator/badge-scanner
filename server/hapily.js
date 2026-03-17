const hubspot = require('./hubspot');

// Cache for discovered type IDs (keyed by access token prefix to handle multiple portals)
let hapilyCache = null;

// Discover Hapily custom object type IDs and association types
async function discoverHapilyObjects(accessToken) {
  if (hapilyCache) return hapilyCache;

  const schemas = await hubspot.getCustomObjectSchemas(accessToken);
  const results = schemas.results || schemas;

  let eventTypeId = null;
  let registrantTypeId = null;

  for (const schema of results) {
    const name = (schema.name || '').toLowerCase();
    const singular = (schema.labels?.singular || '').toLowerCase();

    if ((name.includes('hapily') || singular.includes('hapily')) && (name.includes('event') || singular.includes('event')) && !name.includes('registrant')) {
      eventTypeId = schema.objectTypeId;
    }
    if ((name.includes('hapily') || singular.includes('hapily')) && (name.includes('registrant') || singular.includes('registrant'))) {
      registrantTypeId = schema.objectTypeId;
    }
  }

  if (!eventTypeId || !registrantTypeId) {
    console.warn('Hapily objects not found. Event:', eventTypeId, 'Registrant:', registrantTypeId);
    console.warn('Available schemas:', results.map(s => `${s.name} (${s.objectTypeId})`).join(', '));
  }

  // Discover association type IDs
  let registrantToContactAssocType = null;
  let registrantToEventAssocType = null;

  if (registrantTypeId) {
    // Registrant → Contact association
    try {
      const contactAssocs = await hubspot.getAssociationTypes(accessToken, registrantTypeId, '0-1');
      if (contactAssocs?.results?.length > 0) {
        registrantToContactAssocType = contactAssocs.results[0].typeId;
      }
    } catch (e) {
      console.warn('Could not discover registrant-to-contact association type:', e.message);
    }

    // Registrant → Event association
    if (eventTypeId) {
      try {
        const eventAssocs = await hubspot.getAssociationTypes(accessToken, registrantTypeId, eventTypeId);
        if (eventAssocs?.results?.length > 0) {
          registrantToEventAssocType = eventAssocs.results[0].typeId;
        }
      } catch (e) {
        console.warn('Could not discover registrant-to-event association type:', e.message);
      }
    }
  }

  hapilyCache = {
    eventTypeId,
    registrantTypeId,
    registrantToContactAssocType,
    registrantToEventAssocType,
  };

  console.log('Hapily objects discovered:', JSON.stringify(hapilyCache, null, 2));
  return hapilyCache;
}

// Clear cache (useful if schema changes or on error)
function clearCache() {
  hapilyCache = null;
}

// Fetch events available for lead capture
async function getLeadCaptureEvents(accessToken) {
  const { eventTypeId } = await discoverHapilyObjects(accessToken);
  if (!eventTypeId) {
    return { events: [], warning: 'Hapily Event custom object not found in this portal.' };
  }

  try {
    const data = await hubspot.searchCustomObjects(
      accessToken,
      eventTypeId,
      [{ propertyName: 'available_in_lead_capture_app', operator: 'EQ', value: 'true' }],
      ['name', 'type', 'start_datetime', 'end_datetime', 'venue', 'city', 'state_region', 'meeting_link', 'address'],
    );

    const events = (data.results || []).map(event => ({
      id: event.id,
      name: event.properties.name || 'Unnamed Event',
      type: event.properties.type || '',
      startDate: event.properties.start_datetime || '',
      endDate: event.properties.end_datetime || '',
      venue: event.properties.venue || '',
      city: event.properties.city || '',
      stateRegion: event.properties.state_region || '',
      address: event.properties.address || '',
      meetingLink: event.properties.meeting_link || '',
    }));

    return { events };
  } catch (err) {
    console.error('Failed to fetch Hapily events:', err.message);
    if (err.status === 403) {
      return { events: [], warning: 'Missing permissions to access Hapily Events. Please re-authorize with custom object scopes.' };
    }
    return { events: [], warning: 'Could not load events.' };
  }
}

// Create a Hapily registrant linked to a contact and event
// Strategy: try creating with inline associations first.
// If that fails, create without associations then add them via v4 API.
async function createRegistrant(accessToken, { contactId, eventId, eventName, firstname, lastname, email, company, jobtitle }) {
  const { registrantTypeId, registrantToContactAssocType, registrantToEventAssocType, eventTypeId } = await discoverHapilyObjects(accessToken);

  if (!registrantTypeId) {
    console.warn('Hapily Registrant object not found — skipping registrant creation');
    return { skipped: true, reason: 'Hapily Registrant custom object not found' };
  }

  const properties = {
    first_name: firstname || '',
    last_name: lastname || '',
    email: email || '',
    company: company || '',
    job_title: jobtitle || '',
    event_id: eventId,
    event_name: eventName,
    status: 'Attended',
    walkup_registration: 'true',
    name: [firstname, lastname].filter(Boolean).join(' ') || email || 'Unknown',
  };

  const associations = [];

  // Associate with contact
  if (contactId && registrantToContactAssocType) {
    associations.push({
      to: { id: contactId },
      types: [{ associationCategory: 'USER_DEFINED', associationTypeId: registrantToContactAssocType }],
    });
  }

  // Associate with event
  if (eventId && registrantToEventAssocType) {
    associations.push({
      to: { id: eventId },
      types: [{ associationCategory: 'USER_DEFINED', associationTypeId: registrantToEventAssocType }],
    });
  }

  // Attempt 1: Create with inline associations
  try {
    const registrant = await hubspot.createCustomObject(accessToken, registrantTypeId, properties, associations);
    console.log('Registrant created with inline associations:', registrant.id);
    return { registrantId: registrant.id };
  } catch (err) {
    console.warn('Inline association create failed:', err.message);
    // Don't give up — try create-then-associate
  }

  // Attempt 2: Create registrant without associations, then associate via v4 API
  try {
    const registrant = await hubspot.createCustomObject(accessToken, registrantTypeId, properties, []);
    const registrantId = registrant.id;
    console.log('Registrant created (no inline assocs):', registrantId);

    const assocResults = [];

    // Associate registrant → contact via v4
    if (contactId && registrantToContactAssocType) {
      const ok = await hubspot.createAssociation(
        accessToken, registrantTypeId, registrantId, '0-1', contactId,
        'USER_DEFINED', registrantToContactAssocType
      );
      assocResults.push({ target: 'contact', ok });
    }

    // Associate registrant → event via v4
    if (eventId && registrantToEventAssocType && eventTypeId) {
      const ok = await hubspot.createAssociation(
        accessToken, registrantTypeId, registrantId, eventTypeId, eventId,
        'USER_DEFINED', registrantToEventAssocType
      );
      assocResults.push({ target: 'event', ok });
    }

    const failed = assocResults.filter(r => !r.ok);
    if (failed.length > 0) {
      console.warn('Some associations failed:', failed.map(f => f.target).join(', '));
    }
    console.log('Association results:', JSON.stringify(assocResults));

    return { registrantId };
  } catch (err2) {
    console.error('Registrant creation fully failed:', err2.message, JSON.stringify(err2.data, null, 2));

    // Last resort: clear cache in case type IDs are stale
    if (hapilyCache) {
      clearCache();
    }

    return { skipped: true, reason: err2.message };
  }
}

module.exports = { discoverHapilyObjects, getLeadCaptureEvents, createRegistrant, clearCache };
