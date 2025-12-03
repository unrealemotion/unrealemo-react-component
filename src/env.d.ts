/// <reference types="vite/client" />

declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "~icons/*" {
  import { FC, SVGProps } from "react";
  const component: FC<SVGProps<SVGSVGElement>>;
  export default component;
}

