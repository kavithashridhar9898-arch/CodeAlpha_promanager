# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Build the TypeScript code
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the necessary files for production
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "start"]
