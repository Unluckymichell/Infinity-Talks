# Wanted channel structure

-   Category
    -   Channel 1
        -   User 1
        -   User 2
        -   User 3
    -   Channel 2
        -   User 1
    -   Channel 3
        -   User 1
        -   User 2
    -   Channel 4
        -   [empty]

# Old concept

Handle all channels in a syncronous loop not waiting for callbacks

-   not last channel
    -   delete if empty
-   last channel
    -   create new if full

# New Concept

### Notes:

Required packages:

-   https://www.npmjs.com/package/node-cache
-   Maybe: https://www.npmjs.com/package/jsonschema

Seperate parsing in steps

1. Analyse given situation and generate actions
    - same as old concept but save actions without running
2. Optimise actions to save api calls
    - if 1 channel is deleted and 1 is created reuse old one and just move
3. Run actions
    - Run all actions using Promis.all() and wait for output

## Additional

-   Log time for each step
-   Allow independent log for each guild (better debuging)
-   Maybe add t!log command to subscribe to guild log
