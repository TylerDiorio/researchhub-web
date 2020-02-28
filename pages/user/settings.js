import React, { Component, Fragment } from "react";
import { css, StyleSheet } from "aphrodite";
import { connect } from "react-redux";
import Ripples from "react-ripples";
import Toggle from "react-toggle";
import "~/components/TextEditor/stylesheets/ReactToggle.css";

import FormSelect from "~/components/Form/FormSelect";
import FormInput from "~/components/Form/FormInput";
import CheckBox from "~/components/Form/CheckBox";
import ComponentWrapper from "~/components/ComponentWrapper";

import { DIGEST_FREQUENCY } from "~/config/constants";
import {
  checkBoxStyles,
  defaultStyles,
  hubStyles,
  selectStyles,
} from "~/config/themes/styles";
import { updateEmailPreference, fetchEmailPreference } from "~/config/fetch";
import {
  buildSubscriptionPatch,
  digestSubscriptionPatch,
  emailPreferencePatch,
} from "~/config/shims";
import { AuthActions } from "~/redux/auth";
import { MessageActions } from "~/redux/message";
import { HubActions } from "~/redux/hub";
import { subscribeToHub, unsubscribeFromHub } from "../../config/fetch";
import { doesNotExist } from "~/config/utils";
import colors from "../../config/themes/colors";

import "./stylesheets/toggle.css";

const frequencyOptions = Object.keys(DIGEST_FREQUENCY).map((key) => {
  return {
    value: DIGEST_FREQUENCY[key],
    label: key,
  };
});

const contentSubscriptionOptions = [
  {
    id: "paperSubscription",
    label: "Threads on papers I authored",
  },
  {
    id: "threadSubscription",
    label: "Comments on a thread I posted",
  },
  {
    id: "commentSubscription",
    label: "Replies to a comment I posted",
  },
  {
    id: "replySubscription",
    label: "Responses to a reply I posted",
  },
];

class UserSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      frequency: null,
      emailRecipientId: null,
      isOptedOut: null,
      // Email Input
      email: this.props.user.email && this.props.user.email,
      activeEmailInput: false,
      transition: false,
    };
    this.emailInputRef = React.createRef();
    contentSubscriptionOptions.forEach((option) => {
      this.state[option.id] = true;
    });
  }

  componentDidMount = async () => {
    if (doesNotExist(this.props.hubs)) {
      this.props.dispatch(HubActions.getHubs());
    }
    if (doesNotExist(this.props.user.email)) {
      await this.props.dispatch(AuthActions.getUser());
    }
    fetchEmailPreference().then((preference) => {
      const frequency = this.getInitialFrequencyOption(preference);
      const contentSubscriptions = this.getInitialContentSubscriptionOptions(
        preference
      );
      const isOptedOut = this.getInitialIsOptedOut(preference);
      this.setState({
        emailRecipientId: preference.id,
        frequency,
        ...contentSubscriptions,
        isOptedOut,
        email: this.props.user.email,
      });
    });
  };

  getInitialFrequencyOption = (emailPreference) => {
    const initial = frequencyOptions.filter((option) => {
      return (
        emailPreference.digestSubscription &&
        option.value ===
          emailPreference.digestSubscription.notificationFrequency
      );
    });
    return initial[0];
  };

  getInitialContentSubscriptionOptions = (emailPreference) => {
    const initial = {};
    const subscriptionKeys = Object.keys(emailPreference).filter((key) => {
      return key.includes("Subscription");
    });
    subscriptionKeys.forEach((key) => {
      initial[key] = !emailPreference[key].none;
    });
    return initial;
  };

  getInitialIsOptedOut = (emailPreference) => {
    return emailPreference.isOptedOut;
  };

  saveEmail = () => {
    this.props.dispatch(MessageActions.showMessage({ show: true, load: true }));
    const currentEmail = this.props.user.email;
    const nextEmail = this.state.email;
    const data = emailPreferencePatch({
      email: nextEmail,
    });
    const updateSubscriptions = false;
    updateEmailPreference(
      this.state.emailRecipientId,
      data,
      updateSubscriptions
    )
      .then(() => {
        this.props.dispatch(MessageActions.showMessage({ show: false }));
        this.props.dispatch(MessageActions.setMessage("Saved!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
        this.setState({});
        this.toggleEmailInput();
      })
      .catch((err) => {
        this.displayError(err);
        this.setState({
          email: currentEmail,
        });
      });
  };

  toggleEmailInput = () => {
    this.setState({ transition: true }, () => {
      setTimeout(() => {
        this.setState(
          {
            activeEmailInput: !this.state.activeEmailInput,
            transition: false,
          },
          () => {
            this.state.activeEmailInput && this.emailInputRef.current.focus();
          }
        );
      }, 50);
    });
  };

  handleEmailChange = (id, value) => {
    this.setState({ email: value });
  };

  renderPrimaryEmail = () => {
    let { email, activeEmailInput, transition } = this.state;

    return (
      <div className={css(styles.container)}>
        <div className={css(styles.labelContainer)}>
          <div className={css(styles.listLabel)} id={"hubListTitle"}>
            {"Primary Email"}
          </div>
          <Ripples
            className={css(styles.editIcon)}
            onClick={this.toggleEmailInput}
          >
            {activeEmailInput ? (
              <i className="fal fa-times" />
            ) : (
              <i className="fas fa-pencil" />
            )}
          </Ripples>
        </div>
        <div
          className={css(
            styles.primaryEmail,
            transition && styles.blurTransition
          )}
        >
          {activeEmailInput ? (
            <form
              className={css(styles.emailInputContainer)}
              onSubmit={(e) => {
                e.preventDefault();
                this.saveEmail();
              }}
            >
              <FormInput
                getRef={this.emailInputRef}
                placeholder={"Enter an email"}
                containerStyle={styles.emailInputStyles}
                inputStyle={styles.emailInput}
                value={this.state.email}
                onChange={this.handleEmailChange}
              />
              <Ripples
                className={css(styles.saveIcon)}
                onClick={(e) => {
                  e.preventDefault();
                  this.saveEmail();
                }}
              >
                <i className="fad fa-paper-plane" />
              </Ripples>
            </form>
          ) : (
            <div className={css(styles.paddedText)}>{email}</div>
          )}
        </div>
      </div>
    );
  };

  renderFrequencySelect() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.listLabel)} id={"hubListTitle"}>
          {"Hub Digest Frequency"}
        </div>
        <div className={css(styles.formContainer)}>
          {/* <div className={css(styles.currentValue)}> */}
          {/* {this.state.frequency} */}
          {/* Daily */}
          {/* </div>   */}
          <FormSelect
            id={"frequencySelect"}
            options={frequencyOptions}
            value={this.state.frequency}
            containerStyle={
              (selectStyles.container, styles.formSelectContainer)
            }
            inputStyle={(selectStyles.input, styles.formSelectInput)}
            onChange={this.handleFrequencyChange}
            isSearchable={false}
          />
        </div>
      </div>
    );
  }

  handleFrequencyChange = (id, option) => {
    const currentFrequency = this.state.frequency;
    this.setState({
      frequency: option,
    });
    const data = digestSubscriptionPatch({
      notificationFrequency: option.value,
    });
    updateEmailPreference(this.state.emailRecipientId, data)
      .then(() => {
        this.props.dispatch(MessageActions.setMessage("Saved!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
      })
      .catch((err) => {
        this.displayError(err);
        this.setState({
          frequency: currentFrequency,
        });
      });
  };

  renderSubscribedHubs = () => {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.listLabel)} id={"hubListTitle"}>
          {"Currently Subscribed Hubs"}
        </div>
        <div className={css(hubStyles.list, styles.hubsList)}>
          {this.props.subscribedHubs.map((hub) => {
            return this.renderHub(hub);
          })}
        </div>
      </div>
    );
  };

  renderHub = (hub) => {
    return (
      <Ripples
        onClick={() => this.handleHubUnsubscribe(hub.id)}
        key={hub.id}
        className={css(hubStyles.entry, styles.hubEntry)}
      >
        {hub.name}
        <div className={css(styles.closeIcon)}>
          <i className="fal fa-times" />
        </div>
      </Ripples>
    );
  };

  handleHubUnsubscribe = (hubId) => {
    const { hubs, topHubs } = this.props;
    unsubscribeFromHub(hubId)
      .then((res) => {
        this.props.dispatch(HubActions.updateHub(hubs, topHubs, { ...res }));
        this.props.dispatch(MessageActions.setMessage("Unsubscribed!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
      })
      .catch(this.displayError);
  };

  renderHubSelect() {
    const subscribedHubIds = this.props.subscribedHubs.map((hub) => hub.id);
    const availableHubs = this.props.hubs.filter((hub) => {
      return !subscribedHubIds.includes(hub.id);
    });
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.listLabel)} id={"hubListTitle"}>
          {"Available Hubs"}
        </div>
        <FormSelect
          id={"hubSelect"}
          options={this.buildHubOptions(availableHubs)}
          containerStyle={(selectStyles.container, styles.formSelectContainer)}
          inputStyle={(selectStyles.input, styles.formSelectInput)}
          onChange={this.handleHubSubscribe}
          isSearchable={true}
          placeholder={"Subscribe to a hub"}
        />
      </div>
    );
  }

  buildHubOptions = (hubs) => {
    return (
      hubs &&
      hubs.map((hub) => {
        return {
          value: hub.id,
          label: hub.name,
        };
      })
    );
  };

  handleHubSubscribe = (id, option) => {
    const { hubs, topHubs } = this.props;

    subscribeToHub(option.value)
      .then((res) => {
        this.props.dispatch(HubActions.updateHub(hubs, topHubs, { ...res }));
        this.props.dispatch(MessageActions.setMessage("Subscribed!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
      })
      .catch(this.displayError);
  };

  renderContentSubscriptions = () => {
    return contentSubscriptionOptions.map((option) => {
      return (
        <div className={css(styles.checkboxEntry)}>
          <div className={css(styles.checkboxLabel)} id={"checkbox-label"}>
            {option.label}
          </div>
          <Toggle
            key={option.id}
            className={"react-toggle"}
            defaultChecked={this.state[option.id]}
            checked={this.state[option.id]}
            disabled={this.state.isOptedOut}
            id={option.id}
            onChange={this.handleContentSubscribe}
          />
        </div>
      );
    });
  };

  handleContentSubscribe = (e) => {
    e && e.preventDefault();
    let id = e.target.id;
    let nextActiveState = e.target.checked;
    const startingActiveState = this.state[id];

    this.setState({
      [id]: nextActiveState,
    });

    const data = buildSubscriptionPatch(id, nextActiveState);
    updateEmailPreference(this.state.emailRecipientId, data)
      .then(() => {
        this.props.dispatch(MessageActions.setMessage("Saved!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
      })
      .catch((err) => {
        this.displayError(err);
        this.setState({
          [id]: startingActiveState,
        });
      });
  };

  renderOptOut = () => {
    return (
      <div className={css(styles.checkboxEntry)}>
        <div className={css(styles.checkboxLabel, styles.optOut)}>
          {"Opt out of all email updates"}
        </div>
        <Toggle
          key={"optOut"}
          defaultChecked={this.state.isOptedOut}
          checked={this.state.isOptedOut}
          className={"react-toggle"}
          active={this.state.isOptedOut}
          // label={"Opt out of all email updates"}
          id={"optOut"}
          onChange={this.handleOptOut}
        />
      </div>
    );
  };

  handleOptOut = (e) => {
    let nextActiveState = e.target.checked;
    const startingActiveState = this.state.isOptedOut;
    this.setState({
      isOptedOut: nextActiveState,
    });

    const data = emailPreferencePatch({ isOptedOut: nextActiveState });
    updateEmailPreference(this.state.emailRecipientId, data)
      .then(() => {
        this.props.dispatch(MessageActions.setMessage("Saved!"));
        this.props.dispatch(MessageActions.showMessage({ show: true }));
      })
      .catch((err) => {
        this.displayError(err);
        this.setState({
          isOptedOut: startingActiveState,
        });
      });
  };

  displayError = (err) => {
    this.props.dispatch(
      MessageActions.setMessage("Oops! Something went wrong.")
    );
    this.props.dispatch(
      MessageActions.showMessage({ show: true, error: true })
    );
  };

  render() {
    return (
      <ComponentWrapper>
        <div className={css(styles.settingsPage)}>
          <div className={css(defaultStyles.title, styles.title)}>
            Email Settings
          </div>
          {this.renderPrimaryEmail()}
          {this.renderFrequencySelect()}
          {this.renderSubscribedHubs()}
          {/* {this.renderHubSelect()} */}

          <div className={css(styles.container)}>
            <div className={css(styles.listLabel)} id={"hubListTitle"}>
              {"Notifications"}
            </div>
            {this.renderContentSubscriptions()}
            {this.renderOptOut()}
          </div>
        </div>
      </ComponentWrapper>
    );
  }
}

const styles = StyleSheet.create({
  settingsPage: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    paddingTop: 30,
  },
  title: {
    paddingBottom: 10,
    letterSpacing: 1.1,
    fontWeight: 500,
  },
  subtitle: {
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    fontSize: 22,
    paddingBottom: 10,
    "@media only screen and (max-width: 1343px)": {
      fontWeight: 500,
      fontSize: 22,
    },
  },
  labelContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listLabel: {
    textTransform: "uppercase",
    fontWeight: 500,
    fontSize: 13,
    letterSpacing: 1.2,
    marginBottom: 15,
    textAlign: "left",
    color: "#a7a6b0",
    transition: "all ease-out 0.1s",
    boxSizing: "border-box",
    ":hover": {
      color: colors.BLACK(),
    },
  },
  container: {
    padding: "15px 10px",
    borderTop: "1px solid #EDEDED",
    transition: "all ease-in-out 0.2s",
    ":hover #hubListTitle": {
      color: colors.BLACK(),
    },
  },
  formSelectContainer: {
    padding: 0,
    margin: 0,
    width: "100%",
  },
  formSelectInput: {
    width: "100%",
  },
  formContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  currentValue: {},
  primaryEmail: {
    width: "100%",
    transition: "all ease-in-out 0.1s",
    fontSize: 16,
    fontWeight: 300,
  },
  blurTransition: {
    filter: "blur(4px)",
  },
  emailIcon: {
    marginRight: 10,
    color: "#707378",
  },
  saveIcon: {
    height: 32,
    width: 32,
    fontSize: 12,
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    backgroundColor: colors.BLUE(),
    color: "#FFF",
    marginLeft: 15,
  },
  editIcon: {
    cursor: "pointer",
    // padding: 8,
    borderRadius: "50%",
    color: "#afb5bc",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 32,
    ":hover": {
      color: colors.BLACK(),
      backgroundColor: "#EDEDED",
    },
  },
  emailInputContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: 5,
  },
  emailInputStyles: {
    padding: 0,
    margin: 0,
    minHeight: "unset",
    // width: '100%'
    width: "calc(100% - 32px)",
  },
  emailInput: {
    width: "100%",
  },
  hubsList: {
    width: "100%",
    boxSizing: "border-box",
    padding: 0,
    "@media only screen and (max-width: 1303px)": {
      padding: 0,
    },
  },
  hubEntry: {
    display: "flex",
    justifyContent: "space-between",
    boxSizing: "border-box",
    marginBottom: 5,

    backgroundColor: "rgb(237, 238, 254)",
    color: colors.PURPLE(1),
    fontWeight: 500,
    textTransform: "uppercase",
    padding: "8px 12px",
    ":hover": {
      backgroundColor: "rgba(237, 238, 254, .7)",
      // borderColor: "hsl(0,0%,70%)",
    },
  },
  closeIcon: {
    cursor: "pointer",
    color: colors.BLACK(),
    borderRadius: "50%",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ":hover": {
      color: "#3f85f7",
    },
  },
  checkboxEntry: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    ":hover #checkbox-label": {
      fontWeight: 400,
    },
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: 300,
  },
  optOut: {
    fontWeight: 400,
  },
});

const mapStateToProps = (state) => ({
  ...state.hubs,
  user: state.auth.user,
});

export default connect(
  mapStateToProps,
  null
)(UserSettings);
