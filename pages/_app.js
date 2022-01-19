import Head from "next/head";
import App from "next/app";
import { ThemeProvider } from "styled-components";

import { theme } from "../theme";
import "../theme/globalStyles.css";
import React from "react";

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
        </Head>

        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </>
    );
  }
}
