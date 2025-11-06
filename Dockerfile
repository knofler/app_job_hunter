# Stage 1: Build the application
FROM node:23-alpine AS builder

# Accept build arguments
ARG NEXT_PUBLIC_ADMIN_TOKEN
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_URL_LOCAL
ARG NEXT_PUBLIC_API_URL_INTERNAL
ARG NEXT_PUBLIC_API_FORCE_REMOTE
ARG AUTH0_BASE_URL
ARG AUTH0_ISSUER_BASE_URL
ARG AUTH0_CLIENT_ID
ARG AUTH0_AUDIENCE

# Set environment variables for build
ENV NEXT_PUBLIC_ADMIN_TOKEN=$NEXT_PUBLIC_ADMIN_TOKEN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL_LOCAL=$NEXT_PUBLIC_API_URL_LOCAL
ENV NEXT_PUBLIC_API_URL_INTERNAL=$NEXT_PUBLIC_API_URL_INTERNAL
ENV NEXT_PUBLIC_API_FORCE_REMOTE=$NEXT_PUBLIC_API_FORCE_REMOTE
ENV AUTH0_BASE_URL=$AUTH0_BASE_URL
ENV AUTH0_ISSUER_BASE_URL=$AUTH0_ISSUER_BASE_URL
ENV AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
ENV AUTH0_AUDIENCE=$AUTH0_AUDIENCE

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies, including devDependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Run the application
FROM node:23-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]