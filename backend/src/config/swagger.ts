import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProManager API',
      version: '1.0.0',
      description: 'Enterprise Project Management Platform — REST API Documentation',
      contact: {
        name: 'ProManager Team',
      },
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
      schemas: {
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'] },
            ownerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            columnId: { type: 'string' },
            assigneeId: { type: 'string', nullable: true },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
          },
        },
        Label: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            color: { type: 'string', description: 'Hex color code' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
            message: { type: 'string', nullable: true },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication — register, login, logout, refresh' },
      { name: 'Projects', description: 'Project CRUD, members, invitations, exports' },
      { name: 'Tasks', description: 'Task management, move, assign, due-dates, calendar' },
      { name: 'Teams', description: 'Team management and member roles' },
      { name: 'Labels', description: 'Global label management' },
      { name: 'Invitations', description: 'Project invitation accept/decline flow' },
      { name: 'Checklists', description: 'Task checklists and checklist items' },
      { name: 'Attachments', description: 'File upload and download for tasks' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Profile', description: 'User profile and preferences' },
      { name: 'Analytics', description: 'Dashboard analytics and charts' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
