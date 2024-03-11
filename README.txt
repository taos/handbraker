Tool for watching a folder and automatically running handbrake on new files.
Also supports limited file renaming.

Current Development Setup:
1. Install node for your environment
2. Download code
3. Setup projects
   > npm install
4. Install Handbrake-CLI

Initial Development Setup tasks:
1. Typescript
  > npm install --save-dev typescript
    - configure: > tsc --init
  > npm install --save-dev ts-node
2. Jest (w/Typescript)
  > npm install --save-dev jest
  > npm install --save-dev @types/jest
  > npm install --save-dev ts-jest
    - configure (https://kulshekhar.github.io/ts-jest/docs/getting-started/installation/#jest-config-file)
    > npx ts-jest config:init
  > VScode config: Add to setting.json -  "jest.pathToConfig" : "./jest.config.js" 
