# Aether-Realms 🌍

Aether-Realms is a next-generation multiplayer voxel sandbox game prototype. Combining the building freedom of classic voxel games with modern graphics, scalable backend architecture, and high-fidelity design.

## 🚀 Features

* **Infinite Voxel World**: Procedurally generated terrain using multi-octave noise.
* **8 Unique Biomes**: Plains, Forest, Desert, Mountains, Snow, Swamp, Ocean, and Beach.
* **Dynamic Environment**: Seamless day/night cycle, dynamic sky color transitions, weather systems (rain, fog), and atmospheric lighting.
* **3D Voxel Engine**: Custom chunk-rendering engine built on `Three.js` with greedy mesh optimization and face culling.
* **Player Survival Mechanics**: First-person FPS controller (`cannon-es` physics), health, hunger, stamina, inventory, and tiered crafting.
* **Modular Monolith Backend**: A highly scalable `NestJS` backend supporting PostgreSQL, Redis caching, and real-time WebSockets.
* **Mission System**: Scalable architecture for daily, dynamic, and player-created (UGC) missions.

## 📂 Project Structure

* `/src`: The frontend 3D game engine (Three.js, Vite, WebGL).
* `/backend`: The backend NestJS server (PostgreSQL, Redis, WebSockets).

## 🛠️ Tech Stack

* **Frontend**: Three.js, Vite, Vanilla CSS (Glassmorphism UI), Cannon-es, Howler.js.
* **Backend**: Node.js, NestJS, TypeORM, PostgreSQL, Redis, Socket.IO.

## 🏃‍♂️ Getting Started

### Play the Frontend Prototype
```bash
npm install
npm run dev
```
Then navigate to `http://localhost:3000`

### Run the Backend (Development)
```bash
cd backend
npm install
npm run start:dev
```

## 📜 License

MIT License
