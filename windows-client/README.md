# Angular Electron App

This project is a combination of Angular and Electron, allowing you to build a cross-platform desktop application using web technologies.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development](#development)
  - [Run Angular App](#run-angular-app)
  - [Run Electron App](#run-electron-app)
- [Build](#build)
  - [Build Angular App](#build-angular-app)
  - [Build Electron App](#build-electron-app)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```
## DEVELOPMENT

### Run Angular App

To run the Angular application in development mode:

   ```bash
    npm start
   ```

   This will start the Angular development server, and you can access the app at http://localhost:4200/ in your browser.

### Run Electron App

To run the Angular application in development mode:

   ```bash
    npm start:electron
   ```

This will build the Angular app, then will launch the Electron app using the Angular build

Please note that you will need to restart the Electron app each time you make changes to the code. So for the current development we will continue to use the Angular app in development mode.

Also, the application will be launched in development mode, so we can use the Local development Server instead of the production one. To remove this behavior, you can remove `--configuration development ` in the `package.json` file.
```bash
"start:electron": "ng build --configuration development --base-href ./ && electron ."
```
The default behavior is to use Production 

## Build

### Build Angular App

### Build Electron App