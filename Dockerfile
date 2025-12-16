FROM browseruse/browseruse:0.10.1

USER root

WORKDIR /app

ENV IN_DOCKER=true

# Copy package files
COPY pyproject.toml README.md ./
COPY src/ src/

# Install the package
RUN pip install --no-cache-dir .

EXPOSE 8080

ENTRYPOINT []
CMD ["usefly", "--port", "8080"]
