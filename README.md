# Plan

- Need to set up way to test with actual camera and calculating in realtime. May have to figure out how to set up your own tunneling via joeltdavis.com and combing through localtunnel source bode

Current working implementation idea:

Similar to how bank apps do it:
Set up inner rectangular boundary within camera view and instruct user to align pills within boundary in order to detect background. (Can possibly even clip outer bounds of camera so that this detection is hidden from users instead of showing weird yellow border)

Find pills by identifying colors that combine into shapes that dont match the background.

Edge cases:

- multicolor background?? (check against all colors from background)
- pills similar color to background? (hopefully non-bg color matching can be super strict allowing for precise boundary detection)

# Plan B

Do multiple scans and try to identify shapes that are most likely to be pills with the following considerations:

- see if there are multiple shapes of similar size, if so we know what color to look for.
  - Due to high potential variance in luminance, match based on detection of colors not found in shapes or background.
- see if boundary pixels for pills have some common features
- see if interpolation can be used to accurately indentify boundary pixels
- more sophisticated anti-matching
  - if pixel is suspected of being a non-match, try performing other checks to confirm
- try to identify background by getting most common color of pixels that don't have boundaries pertaining to the most common shape in the image
- after initial scans, try to find pills by matching by colors found in the most common pill-like shape found
- big pp

# Plan C

combine techniques from A and B

# Resources

- [Binary Robust Independent Elementary Features](https://github.com/eduardolundgren/tracking.js/blob/master/src/features/Brief.js)
- [Viola Jones Object Detection Framework](https://github.com/eduardolundgren/tracking.js/blob/master/src/detection/ViolaJones.js)
- [Features from accelerated segment test](https://github.com/eduardolundgren/tracking.js/blob/master/src/features/Fast.js)
- [Feature tracking example using tracking.js](https://github.com/eduardolundgren/tracking.js/blob/master/examples/fast.html)
- [tracking.js source code](https://github.com/eduardolundgren/tracking.js)

# Findings

[tracking.js](https://trackingjs.com/) is a free open source library that implements sophisticated camera tracking features using advanced image processing techniques as well as computer vision neural networks. May be able to glean glean things from looking at the source code and reverse engineer what we need from there. Ideally we would be able to create our own implementation without using any external dependencies so that it can work on mobile devices.

# Dev stuff

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Tunneling with localhost.run

Default instructions for generating ssh key at [localhost.run](https://localhost.run/docs) don't work.

1. Go to [admin.localhost.run](https://admin.localhost.run) and login with your e-mail
2. Generate ssh key
   > ssh-keygen -t ed25519 -C "myemail@example.com"
3. Add new ssh key at [admin.localhost.run](https://admin.localhost.run)
4. Run using ssh command
   > ssh -R 80:localhost:3000 localhost.run
