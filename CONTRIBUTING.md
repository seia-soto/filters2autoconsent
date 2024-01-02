# Contributing to `filters2autoconsent`

The development of `filters2autoconsent` requires Node.JS version `20.10` or higher and PNPM as package manager.
After installing dependencies via the following command, you're all set.

```sh
npm i -g pnpm
git clone 'repository url'
cd filters2autoconsent
```

## Status of parsable filters

You can find the proposed filter syntax in [`/test/resources/rules.txt`](/test/resources/rules.txt).

| Type            | Keyword | Description                         | Status             |
|-----------------|---------|-------------------------------------|--------------------|
| File            | (none)  | The entire file.                    | ✅ Supported        |
| RuleDeclaration | `##`    | The declaration identifier of rule. | 📝 Partial support |
| Identifier      | (none)  | The identifier or any value.        | 📝 Type dependant  |
