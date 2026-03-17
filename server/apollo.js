const fetch = require('node-fetch');

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

/**
 * Search Apollo for a person by name and company to find their email.
 * Uses the People Match endpoint.
 */
async function enrichContact({ firstname, lastname, company }) {
  if (!APOLLO_API_KEY) {
    return { enriched: false, reason: 'APOLLO_API_KEY not configured' };
  }

  if (!firstname && !lastname) {
    return { enriched: false, reason: 'Name required for enrichment' };
  }

  try {
    const res = await fetch('https://api.apollo.io/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        first_name: firstname || '',
        last_name: lastname || '',
        organization_name: company || '',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Apollo API error:', res.status, errText);
      return { enriched: false, reason: `Apollo API error: ${res.status}` };
    }

    const data = await res.json();
    const person = data.person;

    if (!person) {
      return { enriched: false, reason: 'No match found in Apollo' };
    }

    return {
      enriched: true,
      email: person.email || '',
      company: person.organization?.name || '',
      jobtitle: person.title || '',
      linkedin: person.linkedin_url || '',
    };
  } catch (err) {
    console.error('Apollo enrichment error:', err.message);
    return { enriched: false, reason: err.message };
  }
}

module.exports = { enrichContact };
