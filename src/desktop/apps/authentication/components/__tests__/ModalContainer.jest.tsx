import { mount } from "enzyme"
import { data as sd } from "sharify"
import React from "react"
import { ModalManager } from "reaction/Components/Authentication/Desktop/ModalManager"
import { ModalContainer } from "../ModalContainer"
import { ModalType } from "@artsy/reaction/dist/Components/Authentication/Types"
import { ContextModule, AuthIntent } from "@artsy/cohesion"
const mediator = require("../../../../lib/mediator.coffee")

jest.mock("sharify")
jest.mock("cookies-js", () => ({
  set: jest.fn(),
}))
jest.useFakeTimers()

const cookieSet = require("cookies-js").set as jest.Mock

describe("ModalContainer", () => {
  beforeEach(() => {
    cookieSet.mockClear()
    sd.AP = {
      loginPagePath: "/login",
      signupPagePath: "/signup",
    }
    sd.CSRF_TOKEN = "sample-token"
  })

  it("Mediator can open a login modal", () => {
    const component = mount(<ModalContainer />)
    mediator.trigger("open:auth", { mode: "login" })
    jest.runTimersToTime(1000)
    const form = component.find(ModalManager).instance().state
    expect(form.currentType).toBe("login")
  })

  it("Mediator can open a signup modal", () => {
    const component = mount(<ModalContainer />)
    mediator.trigger("open:auth", { mode: "signup" })
    jest.runTimersToTime(1000)
    const form = component.find(ModalManager).instance().state
    expect(form.currentType).toBe("signup")
  })

  it("Mediator can open a reset_password modal", () => {
    const component = mount(<ModalContainer />)
    mediator.trigger("open:auth", { mode: "reset_password" })

    jest.runTimersToTime(1000)
    const form = component.find(ModalManager).instance().state
    expect(form.currentType).toBe("reset_password")
  })

  it("Sets a cookie when opening the modal", () => {
    mount(<ModalContainer />)
    mediator.trigger("open:auth", { mode: "login", destination: "foo" })

    expect(cookieSet).toBeCalledWith("destination", "foo", { expires: 86400 })
  })

  it("#onSocialAuthEvent sets analytics cookie for login", () => {
    const component = mount(<ModalContainer />).instance() as ModalContainer
    component.onSocialAuthEvent({
      mode: ModalType.login,
      contextModule: ContextModule.popUpModal,
      copy: "Log in to artsy",
      triggerSeconds: 3,
      intent: AuthIntent.viewArtist,
      destination: "http://artsy.net/artist/andy-warhol",
      service: "facebook",
      user: { id: "123" },
    })

    expect(cookieSet).toBeCalledWith(
      "analytics-login",
      '{"action":"successfullyLoggedIn","auth_redirect":"http://artsy.net/artist/andy-warhol","context_module":"popUpModal","modal_copy":"Log in to artsy","intent":"viewArtist","service":"facebook","trigger":"timed","trigger_seconds":3,"type":"login","user_id":"123"}',
      { expires: 86400 }
    )
  })

  it("#onSocialAuthEvent sets analytics cookie for signup", () => {
    const component = mount(<ModalContainer />).instance() as ModalContainer
    component.onSocialAuthEvent({
      mode: ModalType.signup,
      contextModule: ContextModule.popUpModal,
      copy: "Sign up for artsy",
      triggerSeconds: 3,
      intent: AuthIntent.viewArtist,
      destination: "http://artsy.net/artist/andy-warhol",
      service: "apple",
      user: { id: "123" },
    })
    expect(cookieSet).toBeCalledWith(
      "analytics-signup",
      '{"action":"createdAccount","auth_redirect":"http://artsy.net/artist/andy-warhol","context_module":"popUpModal","modal_copy":"Sign up for artsy","intent":"viewArtist","onboarding":false,"service":"apple","trigger":"timed","trigger_seconds":3,"type":"signup","user_id":"123"}',
      { expires: 86400 }
    )
  })
})
