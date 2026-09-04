# Quickstart — Run the Site on Your Computer

Follow these steps to see the menu site running locally. You only need to do the setup once.

## Step 1 — Check you have Node.js

Open **PowerShell** and run:

```powershell
node --version
```

You need **v22.12 or higher**. If you don't have it, download it from [nodejs.org](https://nodejs.org) (install the LTS version).

## Step 2 — Open the project folder

```powershell
cd C:\Users\chhay\Desktop\PersonalProjects\MenuProject
```

## Step 3 — Install dependencies (only the first time)

```powershell
npm install
```

This takes a couple of minutes the first time. You'll see a checkmark when it's done.

## Step 4 — Start the site

```powershell
npm run dev
```

You'll see something like:

```
  local: http://localhost:4321
```

## Step 5 — Open it in your browser

Go to **http://localhost:4321**

You'll see the directory of all restaurants. Click any one to see its menu.

### Direct links
| Page | URL |
|---|---|
| All restaurants | http://localhost:4321 |
| Bella Italia (Italian fine dining) | http://localhost:4321/r/bella-italia/ |
| Matcha & Co. (modern café) | http://localhost:4321/r/matcha-minimal/ |
| NEON BURGER (street food) | http://localhost:4321/r/neon-burger/ |

---

## Live editing

While `npm run dev` is running, you can **edit any `config.json` file and just save** — the browser page updates automatically. Change a price, watch it change on screen. This is the fastest way to preview your changes.

## Stopping the server

Click into the PowerShell window and press **Ctrl + C**.

---

## Working on files

Use **VS Code** (recommended — it color-codes JSON and flags mistakes):

1. Open VS Code
2. **File → Open Folder** → select the `MenuProject` folder
3. All restaurant folders are on the left panel — click any `config.json` to edit it

## I made a mistake — how do I check?

Run this in PowerShell (in the project folder):

```powershell
npm run validate:configs
```

It tells you exactly which file and which line has a problem.