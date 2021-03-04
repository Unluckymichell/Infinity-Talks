# Naming Rule Overview

Naming Rules are strings telling the bot how to name a specific channel.\
They can not change the behavior of inftalks as they are purely visual.

## Syntax (Pseudo html)

The syntax of naming rules follows the html syntax as mutch as posible to make it more easy to understand.\
All the following examples will be clearly contrained within quotes like this `"RULE"`
RULE is just a placeholder here! It`s not required.

<hr>

## Variables

Variables are prefixed with a `$` sing and can be used anywhere in the rule.\
The most basic use case is channel numbering. The variable `$pos` can be used here. It will always represent the position of the channel starting from one.

### Sample rule using "§pos" variable:

`"Voice §pos"` _will result in:_\

-   Category
    -   `Voice 1`
    -   `Voice 2`
    -   `Voice 3`
    -   ...

### All availabel Variables:

-   `$pos` - The channel position (starts at 1)
-   `$locked` - If the channel is locked (true or false)
-   `$userCount` - The amount of connected members

<hr>

## Functions

Functions are basicaly vars that have not yet been resolved, they will often take arguments that are nessesary to get the desired values.\
They are prefixed with a `^` sign and will be parsed after all variables have been resolved. How to properly use output like true/false will be mentioned in the "Blocks" section further down.\
A Fuction can have arguments but this is not neccesary.\
If a function fails (no args, wrong arg type) it should not output anything, but unexpected behaviour is not impossible.

### Sample rule using "^hasMember(ID)" function:

`"Creator here: ^hasMember(249216280555552779)"` _will result in:_\

-   Category
    -   `Creator here: false`
        -   Some member
    -   `Creator here: true`
        -   The bot creator
    -   `Creator here: false`
        -   Some member

### All availabel Functions:

-   `^isEven(NUMBER)` - Check if NUMBER (vars can be used) is even (true or false)
-   `^hasMember(ID)` - Check if a member with a certain discord ID is present in the channel (true or false)
-   `^mostPlayedGame()` - Will result in the most played game by looking at the playing state of all present members

<hr>

## Blocks (if Block)

Like in normal html any basic string is just fixed text, but with special blocks, this behavior can be changed.

The most usefull block is the if block

### Sample:

```html
"TEXT_STATIC<if:CONDITION>TEXT_CONDITION_TRUE<else>TEXT_CONDITION_FALSE</if>"
```

The `<else>` part is not required!

Placeholder definition:

-   TEXT_STATIC - Will not be affected by if block as its "outside" of the block
-   TEXT_CONDITION_TRUE - Will be left present if the condition is true
-   TEXT_CONDITION_FALSE - Will be left present if the condition is false

Conditions will get more advanced but right now you can only check if a value equals a other value using `==`

### Sample rule naming each second channel differently:

```html
<if:^isEven($pos)>Even Voice Channel<else>Uneven Voice Channel</if>
```

_will result in:_

-   Category
    -   `Even Voice Channel`
    -   `Uneven Voice Channel`
    -   `Even Voice Channel`
    -   ...
