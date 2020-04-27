import Cookies from "cookies-js"
import React from "react"
import { data as sd } from "sharify"

import { handleSubmit, setCookies } from "../helpers"
import { ModalManager } from "@artsy/reaction/dist/Components/Authentication/Desktop/ModalManager"
import {
  ModalOptions,
  ModalType,
} from "reaction/Components/Authentication/Types"
import { createdAccount, successfullyLoggedIn } from "@artsy/cohesion"

const mediator = require("../../../lib/mediator.coffee")

export class ModalContainer extends React.Component<any> {
  public manager: ModalManager | null

  UNSAFE_componentWillMount() {
    mediator.on("open:auth", this.onOpenAuth)
    mediator.on("auth:error", this.onAuthError)
  }

  onOpenAuth = (options: ModalOptions) => {
    options.destination = options.destination || location.href
    if (options && (options.mode as any) === "register") {
      options.mode = ModalType.signup
    }

    setCookies(options)
    setTimeout(
      () => {
        if (this.manager) {
          this.manager.openModal(options)
        }
      },
      document.readyState === "complete" ? 0 : 500
    )
  }

  onAuthError = (err: any) => {
    if (this.manager) {
      this.manager.setError(err)
    }
  }

  onSocialAuthEvent = ({
    mode,
    contextModule,
    copy,
    triggerSeconds,
    intent,
    redirectTo,
    destination,
    service,
    user,
  }: any) => {
    const analyticsOptions = {
      type: mode,
      contextModule,
      copy,
      triggerSeconds,
      intent,
      authRedirect: redirectTo || destination,
      service,
      userId: user && user.id,
    }
    let options
    switch (mode) {
      case "signup":
        options = createdAccount(analyticsOptions)
        break
      case "login":
        options = successfullyLoggedIn(analyticsOptions)
        break
    }

    Cookies.set(`analytics-${mode}`, JSON.stringify(options), {
      expires: 60 * 60 * 24,
    })
  }

  render() {
    return (
      <ModalManager
        ref={ref => (this.manager = ref)}
        submitUrls={{
          login: sd.AP.loginPagePath,
          signup: sd.AP.signupPagePath,
          apple: sd.AP.applePath,
          facebook: sd.AP.facebookPath,
        }}
        csrf={sd.CSRF_TOKEN}
        handleSubmit={handleSubmit}
        onSocialAuthEvent={this.onSocialAuthEvent}
        onModalClose={() => {
          mediator.trigger("modal:closed")
        }}
        showRecaptchaDisclaimer={true}
      />
    )
  }
}
