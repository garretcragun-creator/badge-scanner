const fetch = require('node-fetch');

const HUBSPOT_API = 'https://api.hubapi.com';

function headers(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// Search contacts by email
async function searchContactByEmail(accessToken, email) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['firstname', 'lastname', 'email', 'company', 'jobtitle'],
      limit: 1,
    }),
  });
  const data = await res.json();
  return data.results?.[0] || null;
}

// Create a new contact
async function createContact(accessToken, properties) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({ properties }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to create contact');
    err.status = res.status;
    err.category = data.category;
    err.data = data;
    throw err;
  }
  return data;
}

// Update an existing contact
async function updateContact(accessToken, contactId, properties) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
    headers: headers(accessToken),
    body: JSON.stringify({ properties }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to update contact');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Create or update a contact (upsert by email)
async function upsertContact(accessToken, properties) {
  try {
    const contact = await createContact(accessToken, properties);
    return { contactId: contact.id, updated: false };
  } catch (err) {
    if (err.category === 'CONFLICT' && properties.email) {
      const existing = await searchContactByEmail(accessToken, properties.email);
      if (existing) {
        await updateContact(accessToken, existing.id, properties);
        return { contactId: existing.id, updated: true };
      }
    }
    throw err;
  }
}

// ─── Company operations ──────────────────────────────────────────

// Search companies by domain
async function searchCompanyByDomain(accessToken, domain) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/companies/search`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
      properties: ['name', 'domain'],
      limit: 1,
    }),
  });
  const data = await res.json();
  return data.results?.[0] || null;
}

// Search companies by name
async function searchCompanyByName(accessToken, name) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/companies/search`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'name', operator: 'EQ', value: name }] }],
      properties: ['name', 'domain'],
      limit: 1,
    }),
  });
  const data = await res.json();
  return data.results?.[0] || null;
}

// Create a company
async function createCompany(accessToken, properties) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/companies`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({ properties }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to create company');
    err.status = res.status;
    err.category = data.category;
    err.data = data;
    throw err;
  }
  return data;
}

// Find or create a company by domain (from email) or name
async function upsertCompany(accessToken, { companyName, email }) {
  // Try domain match first (most reliable)
  const domain = email ? email.split('@')[1] : null;
  if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail') && !domain.includes('outlook') && !domain.includes('icloud') && !domain.includes('aol')) {
    const existing = await searchCompanyByDomain(accessToken, domain);
    if (existing) {
      return { companyId: existing.id, created: false };
    }
  }

  // Try name match
  if (companyName) {
    const existing = await searchCompanyByName(accessToken, companyName);
    if (existing) {
      return { companyId: existing.id, created: false };
    }
  }

  // Create new company
  if (!companyName && !domain) return null;
  const properties = { name: companyName || domain };
  if (domain) properties.domain = domain;
  const company = await createCompany(accessToken, properties);
  return { companyId: company.id, created: true };
}

// Associate contact with company (uses default association type 1)
async function associateContactWithCompany(accessToken, contactId, companyId) {
  const res = await fetch(
    `${HUBSPOT_API}/crm/v4/objects/contacts/${contactId}/associations/companies/${companyId}`,
    {
      method: 'PUT',
      headers: headers(accessToken),
      body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.warn('Contact-company association failed:', res.status, text);
    return false;
  }
  return true;
}

// ─── Notes ───────────────────────────────────────────────────────

// Create a note associated with a contact
async function createNote(accessToken, contactId, noteBody) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/notes`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date().toISOString(),
      },
      associations: [{
        to: { id: contactId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
      }],
    }),
  });
  if (!res.ok) {
    console.warn('Note creation failed:', res.status, await res.text());
  }
  return res.ok;
}

// ─── Custom objects ──────────────────────────────────────────────

// Get all custom object schemas (for discovering Hapily type IDs)
async function getCustomObjectSchemas(accessToken) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/schemas`, {
    headers: headers(accessToken),
  });
  if (!res.ok) {
    const err = new Error('Failed to fetch custom object schemas');
    err.status = res.status;
    if (res.status === 403) {
      err.code = 'MISSING_SCOPES';
      err.message = 'Missing custom object scopes. Please re-authorize the app with custom object permissions.';
    }
    throw err;
  }
  return res.json();
}

// Search custom objects
async function searchCustomObjects(accessToken, objectTypeId, filters, properties, limit = 100) {
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/${objectTypeId}/search`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({
      filterGroups: [{ filters }],
      properties,
      limit,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Custom object search failed for ${objectTypeId}:`, res.status, text);
    const err = new Error('Custom object search failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Create a custom object with optional associations
async function createCustomObject(accessToken, objectTypeId, properties, associations = []) {
  const body = { properties };
  if (associations.length > 0) {
    body.associations = associations;
  }
  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/${objectTypeId}`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Failed to create custom object');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ─── Associations ────────────────────────────────────────────────

// Get association type labels between two object types
async function getAssociationTypes(accessToken, fromObjectType, toObjectType) {
  const res = await fetch(`${HUBSPOT_API}/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`, {
    headers: headers(accessToken),
  });
  if (!res.ok) {
    console.warn(`Association types fetch failed for ${fromObjectType} -> ${toObjectType}:`, res.status);
    return null;
  }
  return res.json();
}

// Create association between two objects (v4 API — more reliable than inline)
async function createAssociation(accessToken, fromType, fromId, toType, toId, associationCategory, associationTypeId) {
  const res = await fetch(
    `${HUBSPOT_API}/crm/v4/objects/${fromType}/${fromId}/associations/${toType}/${toId}`,
    {
      method: 'PUT',
      headers: headers(accessToken),
      body: JSON.stringify([{ associationCategory, associationTypeId }]),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.warn(`Association failed ${fromType}/${fromId} → ${toType}/${toId}:`, res.status, text);
    return false;
  }
  return true;
}

module.exports = {
  searchContactByEmail,
  createContact,
  updateContact,
  upsertContact,
  searchCompanyByDomain,
  searchCompanyByName,
  createCompany,
  upsertCompany,
  associateContactWithCompany,
  createNote,
  getCustomObjectSchemas,
  searchCustomObjects,
  createCustomObject,
  getAssociationTypes,
  createAssociation,
};
