# filters2autoconsent

Adblocker filter-like syntax to [autoconsent](https://github.com/duckduckgo/autoconsent) rules and test suites.

## Usage

```
--file, f <input>
    Specifies input file

--out, -o <output>
    Specifies output file

--pretty, p
    Prettify output JSON
```

- If no `file` specified, the program will use the input from `stdin`.
- If no `output` specified, the program will print to `stdout`.

## Syntax

```
domain.tld##selector[$option1][,option2=value][, ...]
-selector:action(args)
[-selector:action(args):chainedAction(args)]
[-...]
+selector:action(args)
[+selector:action(args):chainedAction(args)]
[+...]
```
