# Stremo Technical Architecture & GCP Cost Analysis

## 🏗 System Architecture

Stremo follows the end-to-end architecture of world-class platforms like YouTube and Netflix, optimized for Google Cloud Platform (GCP).

### 1. Ingestion (The Streamer)
- **Protocol**: RTMP/WebRTC.
- **PoP Servers**: Streamers connect to the nearest Google Cloud region (e.g., `us-central1`, `asia-southeast1`) to minimize ingest latency.

### 2. Processing (The Backbone)
- **Transcoding**: **Google Cloud Transcoder API**. Converts the raw ingest into multiple bitrates (ABR) using H.264/AV1 codecs.
- **Segmentation**: Video is divided into 2-6 second chunks for HLS/DASH compatibility.

### 3. Storage (The Archive)
- **Hot Storage**: **Google Cloud Storage (Standard)** for recent VODs.
- **Cold Storage**: **GCS (Archive)** for long-term storage of old broadcasts.

### 4. Delivery (The Viewer)
- **CDN**: **Google Cloud Media CDN**. Leverages Google's global edge network for sub-second delivery.
- **Protocol**: QUIC/HTTP3 for optimized throughput.

---

## 💰 GCP Cost Analysis (Production Grade)

### Scenario:
- **Users (Streamers)**: 25
- **Streaming Duration**: 10 hours/day
- **Period**: 1 week (7 days)
- **Total Streaming Hours**: 1,750 hours
- **Resolution**: 1080p (HD) at 5 Mbps

### 1. Transcoding (Transcoder API)
- **Rate**: ~$0.015 per minute for HD.
- **Calculation**: 1,750 hours * 60 mins * $0.015 = **$1,575.00**

### 2. Storage (Cloud Storage)
- **Data Generated**: 1,750 hours * 3600s * 5 Mbps / 8 = ~3,937 GB.
- **Rate**: $0.02 per GB/month.
- **Calculation**: 3,937 GB * $0.02 = **$78.74**

### 3. Egress/CDN (Media CDN)
- **Assumption**: 100 viewers per stream (average).
- **Total Data Transferred**: 3,937 GB * 100 = 393,700 GB.
- **Rate**: ~$0.05 per GB (Tiered).
- **Calculation**: 393,700 GB * $0.05 = **$19,685.00**

### 4. Compute & Load Balancing
- **GKE/Compute Engine**: ~$200/month.
- **Calculation (Pro-rated for 1 week)**: **$50.00**

### **Total Estimated Weekly Cost: ~$21,388.74**

> [!IMPORTANT]
> **Free Trial Credits ($1000)**:
> With $1000 in credits, you can support approximately **80 hours** of total HD streaming with 100 concurrent viewers before the credits are exhausted. To stay within budget, consider:
> 1. Limiting resolution to 720p.
> 2. Reducing the number of concurrent viewers.
> 3. Using Cloudflare's free tier for egress (though GCP Media CDN is superior for latency).

---

## 🛠 Tech Stack Comparison

| Component | Stremo (GCP) | Industry Standard (AWS) |
| :--- | :--- | :--- |
| **Ingest** | Cloud Load Balancing | AWS Global Accelerator |
| **Transcoding** | Transcoder API | AWS Elemental MediaLive |
| **Storage** | Cloud Storage | Amazon S3 |
| **CDN** | Media CDN | Amazon CloudFront |
| **Database** | Firestore / Spanner | DynamoDB / Aurora |
| **Real-time** | Socket.io on GKE | AWS AppSync / IoT Core |
