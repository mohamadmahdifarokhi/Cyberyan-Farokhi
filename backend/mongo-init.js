// MongoDB initialization script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('vc_did_db');

// Create collections with validation
db.createCollection('credentials', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['did', 'vc', 'userInfo', 'jwt', 'createdAt'],
      properties: {
        did: {
          bsonType: 'string',
          description: 'Decentralized Identifier - required'
        },
        vc: {
          bsonType: 'object',
          description: 'Verifiable Credential - required'
        },
        userInfo: {
          bsonType: 'object',
          required: ['name', 'email'],
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            passportImage: { bsonType: 'string' },
            selfieImage: { bsonType: 'string' }
          }
        },
        jwt: {
          bsonType: 'string',
          description: 'JWT token - required'
        },
        fcmToken: {
          bsonType: 'string',
          description: 'Firebase Cloud Messaging token for push notifications'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp - required'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('auditlogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['did', 'hash', 'operation', 'timestamp'],
      properties: {
        did: {
          bsonType: 'string',
          description: 'Decentralized Identifier - required'
        },
        hash: {
          bsonType: 'string',
          description: 'Hash of the operation - required'
        },
        operation: {
          bsonType: 'string',
          description: 'Operation type - required'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Operation timestamp - required'
        },
        metadata: {
          bsonType: 'object',
          description: 'Additional metadata'
        },
        processingTime: {
          bsonType: 'number',
          description: 'Processing time in milliseconds'
        }
      }
    }
  }
});

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['date', 'registrationCount'],
      properties: {
        date: {
          bsonType: 'date',
          description: 'Date for analytics - required'
        },
        registrationCount: {
          bsonType: 'number',
          description: 'Number of registrations - required'
        },
        totalProcessingTime: {
          bsonType: 'number',
          description: 'Total processing time in milliseconds'
        },
        averageProcessingTime: {
          bsonType: 'number',
          description: 'Average processing time in milliseconds'
        },
        peakHour: {
          bsonType: 'number',
          description: 'Peak hour of the day (0-23)'
        }
      }
    }
  }
});

// Create indexes for better query performance
db.credentials.createIndex({ did: 1 }, { unique: true });
db.credentials.createIndex({ createdAt: -1 });
db.credentials.createIndex({ 'userInfo.email': 1 });

db.auditlogs.createIndex({ did: 1 });
db.auditlogs.createIndex({ timestamp: -1 });
db.auditlogs.createIndex({ operation: 1 });

db.analytics.createIndex({ date: 1 }, { unique: true });

print('MongoDB initialization completed successfully');
print('Collections created: credentials, auditlogs, analytics');
print('Indexes created for optimal query performance');
