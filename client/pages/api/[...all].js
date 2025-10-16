// API route for client-only deployment
// This will handle API requests when deployed separately from server

export default function handler(req, res) {
  // For now, return a simple message indicating the API endpoint
  // In production, you would either:
  // 1. Deploy the server separately and proxy requests
  // 2. Implement the API logic directly in Next.js API routes
  
  res.status(200).json({
    success: true,
    message: 'Crypto Wallet API endpoint',
    method: req.method,
    path: req.query.all?.join('/') || '',
    note: 'Server functionality needs to be implemented in Next.js API routes or deployed separately'
  });
}
