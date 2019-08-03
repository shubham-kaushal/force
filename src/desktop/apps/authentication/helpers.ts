import Cookies from "cookies-js"
import {
  ModalType,
  ModalOptions,
} from "reaction/Components/Authentication/Types"
import { data as sd } from "sharify"
import { pickBy, identity } from "lodash"

const mediator = require("../../lib/mediator.coffee")
const LoggedOutUser = require("../../models/logged_out_user.coffee")

export const handleSubmit = (
  type: ModalType,
  modalOptions: ModalOptions,
  values,
  formikBag
) => {
  const user = new LoggedOutUser()
  const {
    contextModule,
    copy,
    destination,
    redirectTo,
    intent,
    signupReferer,
    trigger,
    triggerSeconds,
  } = modalOptions

  /*
   * These are the attributes that will be saved on the user. We are moving
   * towards using `intent` on analytics, but Gravity expects `signupIntent`
   */
  const userAttributes = Object.assign({}, values, {
    _csrf: sd.CSRF_TOKEN,
    signupIntent: intent,
    signupReferer,
    agreed_to_receive_emails: values.accepted_terms_of_service,
  })

  user.set(userAttributes)

  const options = {
    success: (_, res) => {
      formikBag.setSubmitting(false)
      const analytics = (window as any).analytics

      let action
      switch (type) {
        case ModalType.login:
          action = "Successfully logged in"
          break
        case ModalType.signup:
          action = "Created account"
          break
        case ModalType.forgot:
          action = "Forgot Password"
          break
      }

      if (analytics) {
        const properties = {
          action,
          user_id: res && res.user && res.user.id,
          trigger,
          trigger_seconds: triggerSeconds,
          intent,
          type,
          context_module: contextModule,
          modal_copy: copy,
          auth_redirect: redirectTo || destination,
          service: "email",
        }
        analytics.track(action, pickBy(properties, identity))
      }

      let afterAuthURL: URL
      if (modalOptions.redirectTo)
        afterAuthURL = new URL(modalOptions.redirectTo, sd.APP_URL)
      else afterAuthURL = getRedirect(type)

      const result = apiAuthWithRedirectUrl(res, afterAuthURL)

      console.log("---------")
      console.log(result)
      console.log("---------")

      // window.location.href = result.href
    },
    error: (_, res) => {
      const error = res.responseJSON
      formikBag.setStatus(error)
      formikBag.setSubmitting(false)
      mediator.trigger("auth:error", error.message)
    },
  }

  switch (type) {
    case ModalType.login:
      user.login(options)
      break
    case ModalType.signup:
      user.signup(options)
      break
    case ModalType.forgot:
      user.forgot(options)
      break
  }
}

export const setCookies = options => {
  const { afterSignUpAction, destination } = options

  if (afterSignUpAction) {
    Cookies.set("afterSignUpAction", JSON.stringify(afterSignUpAction))
  }

  if (destination) {
    Cookies.set("destination", destination, {
      expires: 60 * 60 * 24,
    })
  }
}

// TODO: is there a type for a Express response?
// TODO: handle forgettting passport
export function apiAuthWithRedirectUrl(response: any, redirectPath: URL): URL {
  const redirectUrl = sd.APP_URL + redirectPath.pathname
  const accessToken = response.user.accessToken

  return new URL(
    `${
      sd.API_URL
    }/users/sign_in?access_token=${accessToken}&redirect_uri=${redirectUrl}`
  )
}

export function getRedirect(type): URL {
  const appBaseURL = new URL(sd.APP_URL)
  const { location } = window
  switch (type) {
    case "login":
    case "forgot":
      if (["/login", "/forgot"].includes(location.pathname)) {
        return new URL("/", appBaseURL)
      } else {
        return new URL(location.href, appBaseURL)
      }
    case "signup":
      return new URL("/personalize", appBaseURL)
    default:
      return new URL(window.location.href, appBaseURL)
  }
}
