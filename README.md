# Royal APIs Suite  
**Gateway • GPRE • AMOR**  
**Copyright (c) 2026 Devin B. Royal. All Rights Reserved.**

The Royal APIs Suite is a proprietary, industrial‑grade platform engineered for:

- **Global Privacy Rights Enforcement (GPRE)**  
- **Autonomous Multi‑AI Orchestration & Routing (AMOR)**  
- **Enterprise Gateway with Auth → Rate Limit → Backend Routing**

This system is designed for high‑security, high‑compliance environments and includes:

- DSAR orchestration engine  
- Multi‑model AI routing (local + cloud providers)  
- Tiered API key authentication  
- Dynamic rate limiting  
- Full OpenAPI specification generation  
- Self‑healing bootstrap scripts  
- Zero‑drift architecture with automated spec regeneration  

---

## ⚠️ Proprietary Notice

This software is **NOT open source**.  
It is **NOT licensed for public use, redistribution, modification, or integration**.

**No individual or organization may use, copy, modify, merge, publish, distribute, sublicense, or sell any part of this software without explicit written permission from:**

**➡️ Devin B. Royal**

Any unauthorized use is strictly prohibited.

---

## 📂 Project Structure

royal-apis-suite/
gateway/
gpre-api/
amor-api/
tools/
generate-openapi.mjs
openapi/
gateway.json
gpre.json
amor.json
full-suite.json
generate_openapi.sh
Code

---

## 🚀 Quick Start

```bash
# Install dependencies
cd royal-apis-suite
npm install --prefix gateway
npm install --prefix gpre-api
npm install --prefix amor-api

# Generate OpenAPI specs
./generate_openapi.sh

# Start services
npm start --prefix gpre-api &
npm start --prefix amor-api &
npm start --prefix gateway &
