// Compatibility layer for basic-auth package
// Works in both development and production environments

export interface Credentials {
  name: string;
  pass: string;
}

function basicAuth(request: Request): Credentials | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const encoded = authHeader.slice(6);
    const decoded = atob(encoded);
    const colonIndex = decoded.indexOf(':');
    
    if (colonIndex === -1) {
      return null;
    }
    
    const name = decoded.slice(0, colonIndex);
    const pass = decoded.slice(colonIndex + 1);
    
    return { name, pass };
  } catch {
    return null;
  }
}

export default basicAuth;