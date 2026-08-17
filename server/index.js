import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// In-memory vaults store
// Key: vaultId -> { id, email, label, password, notes, service, createdAt, claimed: boolean, lastOpenedAt: number }
const vaults = new Map();

// API: List all user vaults for the dashboard
app.get('/api/vaults', (req, res) => {
  const list = Array.from(vaults.values()).sort((a, b) => b.createdAt - a.createdAt);
  return res.json(list);
});

// API: Create or update a vault entry in the user's dashboard
app.post('/api/vault', (req, res) => {
  const { id: existingId, email, label, password, notes, service } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'البريد الإلكتروني غير صالح' });
  }

  const id = existingId || crypto.randomBytes(4).toString('hex');
  const existing = vaults.get(id);

  const vault = {
    id,
    email: email.trim(),
    label: label?.trim() || 'حساب بريد',
    password: password?.trim() || '',
    notes: notes?.trim() || '',
    service: service || (email.includes('gmail') ? 'gmail' : email.includes('outlook') ? 'outlook' : 'custom'),
    claimed: existing ? existing.claimed : false,
    openedAt: existing ? existing.openedAt : null,
    createdAt: existing ? existing.createdAt : Date.now(),
    updatedAt: Date.now()
  };

  vaults.set(id, vault);

  return res.json({
    success: true,
    vault
  });
});

// API: Delete a vault from dashboard
app.delete('/api/vault/:id', (req, res) => {
  const { id } = req.params;
  const deleted = vaults.delete(id);
  return res.json({ success: deleted });
});

// API: Get vault by ID (when opened via link on phone)
app.get('/api/vault/:id', (req, res) => {
  const { id } = req.params;
  const vault = vaults.get(id);

  if (!vault) {
    return res.status(404).json({ error: 'الرابط غير موجود' });
  }

  // Mark as opened
  if (!vault.openedAt) {
    vault.openedAt = Date.now();
    io.to(`vault_${id}`).emit('vault:opened', { id });
  }

  return res.json({
    id: vault.id,
    email: vault.email,
    label: vault.label,
    password: vault.password,
    notes: vault.notes,
    service: vault.service,
    claimed: vault.claimed
  });
});

// API: Claim / click "موافق" on phone
app.post('/api/vault/:id/claim', (req, res) => {
  const { id } = req.params;
  const vault = vaults.get(id);

  if (!vault) {
    return res.status(404).json({ error: 'الرابط غير موجود' });
  }

  vault.claimed = true;
  vault.claimedAt = Date.now();

  io.to(`vault_${id}`).emit('vault:claimed', {
    id,
    claimedAt: vault.claimedAt
  });

  return res.json({ success: true, message: 'تم' });
});

// Socket.io Realtime connections
io.on('connection', (socket) => {
  socket.on('join_vault', (vaultId) => {
    if (vaultId) {
      socket.join(`vault_${vaultId}`);
      const vault = vaults.get(vaultId);
      if (vault) {
        if (vault.openedAt) {
          socket.emit('vault:opened', { id: vaultId });
        }
        if (vault.claimed) {
          socket.emit('vault:claimed', { id: vaultId });
        }
      }
    }
  });

  socket.on('leave_vault', (vaultId) => {
    if (vaultId) {
      socket.leave(`vault_${vaultId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`UserVault Server running on http://localhost:${PORT}`);
});
