const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./customers.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create customers table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rawInput TEXT,
    visitReason TEXT,
    needsFinancing BOOLEAN,
    willFinalizePaperwork BOOLEAN,
    needsAppraisal BOOLEAN,
    wantsWarranty BOOLEAN,
    preferredTimeframe TEXT,
    intentType TEXT,
    timeAllocation TEXT,
    score REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'waiting'
  )`);

  // Insert sample data if table is empty
  db.get("SELECT COUNT(*) as count FROM customers", (err, row) => {
    if (err) {
      console.error('Error checking customers count:', err);
    } else if (row.count === 0) {
      console.log('Inserting sample customers...');
      const sampleCustomers = [
        {
          name: "John Smith",
          rawInput: "I'm looking to buy a new SUV today and wanted to check out options",
          visitReason: JSON.stringify(["purchase"]),
          needsFinancing: 1,
          willFinalizePaperwork: 1,
          needsAppraisal: null,
          wantsWarranty: 1,
          preferredTimeframe: "today",
          intentType: "purchase",
          timeAllocation: "extended",
          score: 0.85
        },
        {
          name: "Sarah Johnson",
          rawInput: "I need to get my oil changed and brakes checked",
          visitReason: JSON.stringify(["browsing"]),
          needsFinancing: null,
          willFinalizePaperwork: null,
          needsAppraisal: null,
          wantsWarranty: 0,
          preferredTimeframe: "this week",
          intentType: "browsing",
          timeAllocation: "short",
          score: 0.35
        },
        {
          name: "Mike Davis",
          rawInput: "Just browsing around, might be interested in trading in my car",
          visitReason: JSON.stringify(["trade_in"]),
          needsFinancing: null,
          willFinalizePaperwork: null,
          needsAppraisal: 1,
          wantsWarranty: 0,
          preferredTimeframe: "this month",
          intentType: "trade-in",
          timeAllocation: "standard",
          score: 0.55
        },
        {
          name: "Lisa Chen",
          rawInput: "I need to buy a car urgently for work, budget around $25k",
          visitReason: JSON.stringify(["test_drive"]),
          needsFinancing: 1,
          willFinalizePaperwork: 1,
          needsAppraisal: null,
          wantsWarranty: 1,
          preferredTimeframe: "today",
          intentType: "purchase",
          timeAllocation: "extended",
          score: 0.90
        }
      ];

      const stmt = db.prepare(`INSERT INTO customers (
        name, rawInput, visitReason, needsFinancing, willFinalizePaperwork, 
        needsAppraisal, wantsWarranty, preferredTimeframe, 
        intentType, timeAllocation, score, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      const now = new Date();
      sampleCustomers.forEach((customer, index) => {
        // Create past timestamps (30, 15, 45, and 5 minutes ago)
        const pastTimes = [
          new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
          new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
          new Date(now.getTime() - 5 * 60 * 1000)   // 5 minutes ago
        ];
        
        stmt.run([
          customer.name, customer.rawInput, customer.visitReason,
          customer.needsFinancing, customer.willFinalizePaperwork,
          customer.needsAppraisal, customer.wantsWarranty,
          customer.preferredTimeframe,
          customer.intentType, customer.timeAllocation, customer.score,
          pastTimes[index].toISOString()
        ]);
      });

      stmt.finalize();
      console.log('Sample customers inserted successfully.');
    }
  });
});

// API Routes

// Get all customers
app.get('/api/customers', (req, res) => {
  db.all("SELECT * FROM customers ORDER BY createdAt DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse visitReason from JSON string to array, or handle old string format
    const processedRows = rows.map(row => {
      let visitReason;
      if (row.visitReason) {
        try {
          // Try to parse as JSON (new format)
          visitReason = JSON.parse(row.visitReason);
        } catch (error) {
          // If parsing fails, it's the old string format
          visitReason = [row.visitReason];
        }
      } else {
        visitReason = [];
      }
      
      return {
        ...row,
        visitReason
      };
    });
    res.json(processedRows);
  });
});

// Add a new customer
app.post('/api/customers', (req, res) => {
  const customer = req.body;
  
  const stmt = db.prepare(`INSERT INTO customers (
    name, rawInput, visitReason, needsFinancing, willFinalizePaperwork, 
    needsAppraisal, wantsWarranty, preferredTimeframe, 
    intentType, timeAllocation, score, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  // Convert visitReason array to JSON string for storage
  const visitReasonString = Array.isArray(customer.visitReason) 
    ? JSON.stringify(customer.visitReason) 
    : JSON.stringify([customer.visitReason]);

  stmt.run([
    customer.name, customer.rawInput, visitReasonString,
    customer.needsFinancing, customer.willFinalizePaperwork,
    customer.needsAppraisal, customer.wantsWarranty,
    customer.preferredTimeframe,
    customer.intentType, customer.timeAllocation, customer.score,
    new Date().toISOString()
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Get the newly inserted customer
    db.get("SELECT * FROM customers WHERE id = ?", [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Parse visitReason from JSON string to array, or handle old string format
      let visitReason;
      if (row.visitReason) {
        try {
          // Try to parse as JSON (new format)
          visitReason = JSON.parse(row.visitReason);
        } catch (error) {
          // If parsing fails, it's the old string format
          visitReason = [row.visitReason];
        }
      } else {
        visitReason = [];
      }
      
      const processedRow = {
        ...row,
        visitReason
      };
      res.json({ id: this.lastID, ...processedRow });
    });
  });

  stmt.finalize();
});

// Update customer status
app.put('/api/customers/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run("UPDATE customers SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Customer status updated successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 