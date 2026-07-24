# Platform Engineering Lab - Workstation Setup

## Operating System

- Windows 10 Pro Version 22H2
- OS Build: 19045.6466

---

## Installed Software

| Software | Version | Status |
|----------|---------|--------|
| Git | 2.54.0 | ✅ Installed |
| Java JDK | 21.0.10 LTS | ✅ Installed |
| Maven | 3.9.16 | ✅ Installed |
| VS Code | Installed | ✅ |
| Docker Desktop | Installed | ⚠️ Waiting for WSL fix |

---

## Current Issues

### Docker Desktop

Issue:

- WSL Kernel missing
- Virtualization disabled

Resolution:

- Enable Virtualization in BIOS
- Update WSL
- Start Docker Desktop
- Verify Docker Engine

---

## Project Structure

Platform-Engineering-Lab
├── applications
├── infrastructure
├── pipelines
├── scripts
└── docs
