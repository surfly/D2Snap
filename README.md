# D2Snap

**D2Snap** is a first-of-kind DOM downsampling algorithm, designed for use with LLM-based web agents.  

![Example of downsampling on an image (top) and a DOM (bottom) instance](./.github/downsampling.png)

## Setup

``` console
npm install
```

> Provide OpenAI API key to .env (compare [example](./.env.example)).

## 

### Evaluate

``` console
npm run eval
```

``` console
npm run eval -- --split 3 --model gpt-4.1 --verbose
```

### Build

``` console
npm run build
```

### Test

``` console
npm run test
```