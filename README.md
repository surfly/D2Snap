# D2Snap

**D2Snap** is a first-of-its-kind DOM downsampling algorithm, designed for use with LLM-based web agents.  

![Example of downsampling on an image (top) and a DOM (bottom) instance](./.github/downsampling.png)

## Setup

``` console
npm install
```

> Provide LLM API provider key(s) to .env (compare [example](./.env.example)).

## 

### Evaluate

``` console
npm run eval
```

``` console
npm run eval:D2Snap -- --split 3 --verbose --provider openai --model gpt-4o
```

### Build

``` console
npm run build
```

### Test

``` console
npm run test
```