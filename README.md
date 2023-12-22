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
