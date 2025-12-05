# This Dockerfile is intentionally minimal to prevent Render.com from using Docker deployment
# We want Render.com to use the render.yaml configuration instead

# Use a minimal base image
FROM alpine:latest

# Create a simple message file
RUN echo "This project uses render.yaml for deployment, not Docker" > /README.txt

# Keep the container running
CMD ["tail", "-f", "/dev/null"]