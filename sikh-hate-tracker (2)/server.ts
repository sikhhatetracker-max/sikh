import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// High-limit body parser to accept PDF uploads as base64 string
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Dynamic paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const BULLETINS_FILE = path.join(DATA_DIR, 'bulletins.json');
const MAGAZINES_FILE = path.join(DATA_DIR, 'magazines.json');

// Initialize store as empty for a fresh clean start
const initialIncidents: any[] = [];
const initialBulletins: any[] = [];
const initialMagazines: any[] = [];

// Seed sample PDF so that downloads work right away
const samplePdfPath = path.join(UPLOADS_DIR, 'sample_magazine_panth_prakash.pdf');
if (!fs.existsSync(samplePdfPath)) {
  // Write a simple valid small placeholder PDF file
  const base64Pdf = 'JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nCiAgICAgL1BhZ2VzIDIgMCBSCiAgPj4KZW5kb2JqCjIgMCBvYmoKICA8PCAvVHlwZSAvUGFnZXMKICAgICAvS2lkcyBbMyAwIFJdCiAgICAgL0NvdW50IDEKICA+PgplbmRvYmoKMyAwIG9iagogIDw8IC9UeXBlIC9QYWdlCiAgICAgL1BhcmVudCAyIDAgUgogICAgIC9SZXNvdXJjZXMgIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PgogICAgIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCiAgICAgL0NvbnRlbnRzIDUgMCBSCiAgPj4KZW5kb2JqCjQgMCBvYmoKICA8PCAvVHlwZSAvRm9udAogICAgIC9TdWJ0eXBlIC9UeXBlMQogICAgIC9CYXNlRm9udCAvSGVsdmV0aWNhCiAgPj4KZW5kb2JqCjUgMCBvYmoKICA8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNzAgNzIwIFRkCihQYW50aCBQcmFrYXNoIE1hZ2F6aW5lIC0gU2lraCBIYXRlIFRyYWNrZXIpIFNqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbSAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDAzMjYg0MDAwMCBuIAp0cmFpbGVyCiAgPDwgL1NpemUgNgogICAgIC9Sb290IDEgMCBSCiAgPj4Kc3RhcnR4cmVmCjQyMQolJUVPRgo=';
  fs.writeFileSync(samplePdfPath, Buffer.from(base64Pdf, 'base64'));
}

// Read utility
const readStore = (filePath: string, seeds: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(seeds, null, 2));
    return seeds;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading file:', filePath, e);
    return seeds;
  }
};

// Write utility
const writeStore = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Serve static documents uploaded by admin
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple persistent memory store backed by JSON files
const getIncidents = () => readStore(INCIDENTS_FILE, initialIncidents);
const getBulletins = () => readStore(BULLETINS_FILE, initialBulletins);
const getMagazines = () => readStore(MAGAZINES_FILE, initialMagazines);

// Authentication middleware using header
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token === 'Jora@1709') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Admin password required' });
  }
};

// Public Endpoints
app.get('/api/incidents', (req, res) => {
  const allIncidents = getIncidents();
  // Filter only approved ones for general public, or check if requester passed admin token
  const isAdminRequest = req.headers['sikh-hate-tracker-role'] === 'admin';
  
  if (isAdminRequest) {
    res.json(allIncidents);
  } else {
    const approvedIncidents = allIncidents.filter((inc: any) => inc.status === 'approved');
    res.json(approvedIncidents);
  }
});

// User reports incident
app.post('/api/incidents', (req, res) => {
  const { title, description, date, country, city, latitude, longitude, sourceUrl, severity, category } = req.body;
  
  if (!title || !description || !date || !country || !latitude || !longitude || !severity || !category) {
    return res.status(400).json({ error: 'Missing required fields for incident submission' });
  }

  const newIncident = {
    id: 'inc-' + Math.random().toString(36).substring(2, 9),
    title,
    description,
    date,
    country,
    city: city || '',
    latitude: Number(latitude),
    longitude: Number(longitude),
    sourceUrl: sourceUrl || '',
    severity,
    category,
    status: 'pending', // Awaiting admin approval
    createdAt: new Date().toISOString()
  };

  const currentIncidents = getIncidents();
  currentIncidents.push(newIncident);
  writeStore(INCIDENTS_FILE, currentIncidents);

  res.status(201).json({ message: 'Incident reported successfully and is pending review.', incident: newIncident });
});

// Bulletins list
app.get('/api/bulletins', (req, res) => {
  res.json(getBulletins().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

// Magazines list
app.get('/api/magazines', (req, res) => {
  res.json(getMagazines().sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()));
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'Jora@1709') {
    res.json({ success: true, token: 'Jora@1709' });
  } else {
    res.status(401).json({ error: 'Invalid password credentials' });
  }
});

// Admin Endpoints (Require Jora@1709 authorization header)

// Update or Approve of Incident
app.post('/api/admin/incidents/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const currentIncidents = getIncidents();
  const incidentIndex = currentIncidents.findIndex((inc: any) => inc.id === id);

  if (incidentIndex === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  currentIncidents[incidentIndex].status = 'approved';
  writeStore(INCIDENTS_FILE, currentIncidents);

  res.json({ message: 'Incident approved successfully', incident: currentIncidents[incidentIndex] });
});

app.post('/api/admin/incidents/:id/reject', requireAdmin, (req, res) => {
  const { id } = req.params;
  const currentIncidents = getIncidents();
  const incidentIndex = currentIncidents.findIndex((inc: any) => inc.id === id);

  if (incidentIndex === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  currentIncidents[incidentIndex].status = 'rejected';
  writeStore(INCIDENTS_FILE, currentIncidents);

  res.json({ message: 'Incident rejected successfully', incident: currentIncidents[incidentIndex] });
});

// Delete Incident
app.delete('/api/admin/incidents/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const currentIncidents = getIncidents();
  const updatedIncidents = currentIncidents.filter((inc: any) => inc.id !== id);

  if (currentIncidents.length === updatedIncidents.length) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  writeStore(INCIDENTS_FILE, updatedIncidents);
  res.json({ message: 'Incident deleted successfully' });
});

// Post Bulletin
app.post('/api/admin/bulletins', requireAdmin, (req, res) => {
  const { title, content, date } = req.body;
  if (!title || !content || !date) {
    return res.status(400).json({ error: 'Title, content and date are required' });
  }

  const newBulletin = {
    id: 'bull-' + Math.random().toString(36).substring(2, 9),
    title,
    content,
    date,
    createdAt: new Date().toISOString()
  };

  const bulletins = getBulletins();
  bulletins.push(newBulletin);
  writeStore(BULLETINS_FILE, bulletins);

  res.status(201).json({ message: 'Bulletin poster successfully', bulletin: newBulletin });
});

// Delete Bulletin
app.delete('/api/admin/bulletins/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const bulletins = getBulletins();
  const updatedBulletins = bulletins.filter((b: any) => b.id !== id);

  if (bulletins.length === updatedBulletins.length) {
    return res.status(404).json({ error: 'Bulletin not found' });
  }

  writeStore(BULLETINS_FILE, updatedBulletins);
  res.json({ message: 'Bulletin deleted successfully' });
});

// Upload Magazine (Saves/Registers PDF document statically or via direct external URL)
app.post('/api/admin/magazines', requireAdmin, (req, res) => {
  const { title, issueNumber, publishDate, description, fileName, fileBase64, fileSize, fileUrl, uploadMethod } = req.body;

  if (!title || !issueNumber || !publishDate) {
    return res.status(400).json({ error: 'Missing required details: title, issueNumber, and publishDate are required' });
  }

  try {
    let finalUrl = '';
    let finalFileName = '';
    let finalFileSize = '';

    if (uploadMethod === 'url' || fileUrl) {
      if (!fileUrl) {
        return res.status(400).json({ error: 'Missing direct PDF document link URL' });
      }
      finalUrl = fileUrl;
      finalFileName = fileName || 'External Document';
      finalFileSize = fileSize || 'External Link';
    } else {
      if (!fileName || !fileBase64) {
        return res.status(400).json({ error: 'Missing uploaded file name or data chunk' });
      }

      // Generate secure filename
      const fileExtension = path.extname(fileName).toLowerCase() === '.pdf' ? '.pdf' : '.pdf';
      const cleanFileName = `panth_prakash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${fileExtension}`;
      const destinationPath = path.join(UPLOADS_DIR, cleanFileName);

      // Decode and save file
      const fileBuffer = Buffer.from(fileBase64, 'base64');
      fs.writeFileSync(destinationPath, fileBuffer);

      finalUrl = `/uploads/${cleanFileName}`;
      finalFileName = fileName;
      finalFileSize = fileSize || `${Math.round(fileBuffer.length / 1024)} KB`;
    }

    // Register details in db catalog
    const newMagazine = {
      id: 'mag-' + Math.random().toString(36).substring(2, 9),
      title,
      issueNumber,
      publishDate,
      description: description || '',
      fileName: finalFileName,
      fileSize: finalFileSize,
      fileUrl: finalUrl,
      createdAt: new Date().toISOString()
    };

    const magazines = getMagazines();
    magazines.push(newMagazine);
    writeStore(MAGAZINES_FILE, magazines);

    res.status(201).json({ message: 'Magazine registered successfully', magazine: newMagazine });
  } catch (error: any) {
    console.error('Error processing magazine registration:', error);
    res.status(500).json({ error: 'Failed to process and register document: ' + error.message });
  }
});

// Delete Magazine
app.delete('/api/admin/magazines/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const magazines = getMagazines();
    const index = magazines.findIndex((mag: any) => mag.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Magazine not found' });
    }

    const magazine = magazines[index];

    // Delete file from disk safely if it is a local upload
    if (magazine.fileUrl && typeof magazine.fileUrl === 'string' && magazine.fileUrl.startsWith('/uploads/')) {
      const filePathStr = path.join(UPLOADS_DIR, path.basename(magazine.fileUrl));
      try {
        if (fs.existsSync(filePathStr)) {
          fs.unlinkSync(filePathStr);
        }
      } catch (e) {
        console.error('Failed to delete physical upload file:', e);
      }
    }

    // Remove from catalog
    const updatedMagazines = magazines.filter((mag: any) => mag.id !== id);
    writeStore(MAGAZINES_FILE, updatedMagazines);

    res.json({ message: 'Magazine cataloged and deleted successfully' });
  } catch (err: any) {
    console.error('Crash in delete magazine route:', err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// Vite Middleware & static fallback handler
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve build static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Sikh Hate Tracker backend running on http://0.0.0.0:${PORT}`);
  });
}

start();
