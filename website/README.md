# Able

Interactive Learning - Able Developer Documentation for `Ubuntu`

## Primary Requirements

This guide expects the following to be prepared and ready.

- A working Ubuntu installation.
- The Able website source code is available.

## 1. Install NPM

Install NPM to your system by running the following.

```sh
sudo apt update
sudo apt install nodejs
sudo apt install npm        # In case it wasn't installed with node.js
```

## 2. Start Local Server

To start the local next.js server, navigate to the primary website directory containing `package.json`.

```sh
cd website
```

Next, run the local server after navigating into the website directory mentioned before. To run the server, open your terminal and run the following.

```sh
npm install
npm run dev
```
