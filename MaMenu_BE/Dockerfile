# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Download dependencies first (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build a statically-linked binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o mamenu-server ./cmd/server/main.go

# ── Run stage ─────────────────────────────────────────────────────────────────
FROM alpine:3.21

WORKDIR /app

# ca-certificates: required for TLS connections to MongoDB Atlas
# tzdata: optional, for timezone support
RUN apk --no-cache add ca-certificates tzdata

# Create log directory (mount as a volume in production)
RUN mkdir -p logs

# Copy the compiled binary
COPY --from=builder /app/mamenu-server .

EXPOSE 8080

CMD ["./mamenu-server"]
