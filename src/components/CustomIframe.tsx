//  See
//  https://blog.logrocket.com/best-practices-react-iframes/
import React, { ReactNode, useState } from "react";
import { createPortal } from "react-dom";

import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

interface CustomIframeProps extends React.ComponentPropsWithoutRef<"iframe"> {
  children?: ReactNode;
}

const CustomIframe = ({ children, ...props }: CustomIframeProps) => {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);

  const cache = createCache({
    key: "css",
    container: contentRef?.contentWindow?.document?.head,
    prepend: true,
  });

  const mountNode = contentRef?.contentWindow?.document?.body;

  return (
    <CacheProvider value={cache}>
      <iframe {...props} ref={setContentRef}>
        {mountNode && createPortal(children, mountNode)}
      </iframe>
    </CacheProvider>
  );
};

export default CustomIframe;
