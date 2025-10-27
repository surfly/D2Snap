<h1 align="center">D2Snap</h1>

![Example of downsampling on an image (top) and a DOM (bottom) instance](./.github/downsampling.png)

**D2Snap** is a first-of-its-kind DOM downsampling algorithm, designed for use with LLM-based web agents.

##

### Integrate

``` ts
D2Snap.d2Snap(
  dom: DOM,
  k: number, l: number, m: number,
  options?: Options
): Promise<string>

D2Snap.adaptiveD2Snap(
  dom: DOM,
  maxTokens: number = 4096,
  maxIterations: number = 5,
  options?: Options
): Promise<string>
```

``` ts
type DOM = Document | Element | string;
type Options = {
  assignUniqueIDs?: boolean; // false (this option is not available with string input)
  debug?: boolean;           // true
};
```

#### Browser

``` html
<script src="https://cdn.jsdelivr.net/gh/surfly/D2Snap@main/dist/D2Snap.browser.js"></script>
```

#### Module

``` console
npm install surfly/D2Snap
```

> Install [jsdom](https://github.com/jsdom/jsdom) to use the library with Node.js:
> ``` console
> npm install jsdom
> ```

``` js
import D2Snap from "@surfly/d2snap";
```

##

### Experiment

#### Setup

``` console
npm install
npm install jsdom
```

#### Build

``` console
npm run build
```

#### Test

``` console
npm run test
```

#### Evaluate

> Provide LLM API provider key(s) to .env (compare [example](./.env.example)).

``` console
npm run eval:<snapshot>
```

> `<snapshot>` ∈ { `gui`, `dom`, `bu`, `D2Snap` }

``` console
npm run eval:D2Snap -- --verbose --split 10,20 --provider openai --model gpt-4o
```

#### Re-create Snapshots

``` console
npm run snapshots:create
```

##

<p align="center">
    <strong>Beyond Pixels: Exploring DOM Downsampling for LLM-Based Web Agents</strong>
    <br>
    <sub><a href="https://github.com/t-ski" target="_blank">Thassilo M. Schiepanski</a></sub>
    &hairsp;
    <sub><a href="https://nl.linkedin.com/in/nicholasp" target="_blank">Nicholas Piël</a></sub>
    <br>
    <sub>Surfly BV</sub>
</p>