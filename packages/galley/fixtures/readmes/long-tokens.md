# long-tokens

Overflow stress: unbroken identifiers and URLs that exceed any sane measure and must wrap or scroll
inside their own box, never the page.

An inline token:
`thisIsAnExtremelyLongCamelCaseIdentifierThatShouldNeverBeAllowedToPushTheMeasureWiderThanTheColumnItLivesIn`.

A bare URL:
https://subdomain.example.com/a/very/long/path/segment/that/keeps/going/and/going/and/going?query=parameter&another=one&yet=more#and-a-fragment-too

A fenced block with a long line:

```
export const CONFIG = { anExceedinglyLongPropertyNameThatRunsOffTheEdge: "andAnEquallyLongStringValueThatAlsoRunsWellPastTheRightEdgeOfTheColumn" };
```

Hyphenated-run:
supercalifragilisticexpialidocious-antidisestablishmentarianism-pneumonoultramicroscopicsilicovolcanoconiosis.
