
async function getFedexToken() {
  try {
    const response = await fetch(`${process.env.FEDEX_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FEDEX_API_KEY,
        client_secret: process.env.FEDEX_SECRET_KEY
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`FedEx auth failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('FedEx auth error:', error.message);
    throw error;
  }
}

export { getFedexToken };