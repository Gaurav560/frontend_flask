export default async function handler(req, res) {
  const { proxy } = req.query;
  const path = Array.isArray(proxy) ? proxy.join('/') : proxy;
  
  try {
    const backendUrl = `http://footage-flow-env.eba-92jebm7b.ap-south-1.elasticbeanstalk.com/${path}`;
    
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(backendUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Backend connection failed',
      details: error.message 
    });
  }
}