// @flow

/**
 * Copyright (c) Garuda Labs, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as Namespaces from 'hyperview/src/services/namespaces';
import type {
  DOMString,
  Element,
  HvComponentOptions,
  NodeList,
  StyleSheets,
} from 'hyperview/src/types';
import {
  DatePickerIOS,
  Modal,
  Platform,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { Props, State } from './types';
import React, { PureComponent } from 'react';
import { createProps, createStyleProp } from 'hyperview/src/services';
import { LOCAL_NAME } from 'hyperview/src/types';
import type { Node as ReactNode } from 'react';
import type { StyleSheet as StyleSheetType } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import styles from './styles';
import { FormatDateContext } from 'hyperview/src';

/**
 * TODO
 */
export default class HvDateField extends PureComponent<Props, State> {
  static namespaceURI = Namespaces.HYPERVIEW;
  static localName = LOCAL_NAME.DATE_FIELD;
  static contextType = FormatDateContext;
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    const element: Element = props.element;
    const value: ?DOMString = element.getAttribute('value');
    this.state = {
      // on iOS, value is used to display the selected choice when
      // the picker modal is hidden
      value: value ? new Date(value) : null,
      // on iOS, pickerValue is used to display the selected choice
      // in the picker modal. On Android, the picker is shown in-line on the screen,
      // so this value gets displayed.
      pickerValue: value ? new Date(value) : new Date(),
      focused: false,
      fieldPressed: false,
      donePressed: false,
      cancelPressed: false,
    };
  }

  toggleFieldPress = () => {
    this.setState({ fieldPressed: !this.state.fieldPressed });
  };

  toggleCancelPress = () => {
    this.setState({ cancelPressed: !this.state.cancelPressed });
  };

  toggleSavePress = () => {
    this.setState({ donePressed: !this.state.donePressed });
  };

  /**
   * Shows the picker, defaulting to the field's value.
   */
  onFieldPress = () => {
    this.setState({
      focused: true,
    });
  };

  /**
   * Hides the picker without applying the chosen value.
   */
  onModalCancel = () => {
    this.setState({
      focused: false,
    });
  };

  /**
   * Hides the picker and applies the chosen value to the field.
   */
  onModalDone = () => {
    const element: Element = this.props.element;
    this.setState({
      focused: false,
      value: this.state.pickerValue,
    });
    element.setAttribute('value', this.state.pickerValue.toISOString());
  };

  /**
   * Renders the picker component. Picker items come from the
   * <picker-item> elements in the <picker-field> element.
   */
  renderPicker = (style: StyleSheetType<*>): ReactNode => {
    const element: Element = this.props.element;

    const minimumDate: ?Date = null;
    const maximumDate: ?Date = null;
    const onDateChange = (value: Date) => {
      this.setState({ pickerValue: value });
    };

    return (
      <DatePickerIOS
        date={this.state.pickerValue}
        mode="date"
        onDateChange={onDateChange}
        minimumDate={maximumDate}
        maximumDate={maximumDate}
      />
    );
  };

  /**
   * Renders a bottom sheet with cancel/done buttons and a picker component.
   * Uses styles defined on the <picker-field> element for the modal and buttons.
   */
  renderPickerModal = (): ReactNode => {
    const element: Element = this.props.element;
    const stylesheets: StyleSheets = this.props.stylesheets;
    const options: HvComponentOptions = this.props.options;
    const modalStyle: Array<StyleSheetType<*>> = createStyleProp(
      element,
      stylesheets,
      {
        ...options,
        styleAttr: 'modal-style',
      },
    );
    const cancelTextStyle: Array<StyleSheetType<*>> = createStyleProp(
      element,
      stylesheets,
      {
        ...options,
        pressed: this.state.cancelPressed,
        styleAttr: 'modal-text-style',
      },
    );
    const doneTextStyle: Array<StyleSheetType<*>> = createStyleProp(
      element,
      stylesheets,
      {
        ...options,
        pressed: this.state.donePressed,
        styleAttr: 'modal-text-style',
      },
    );
    const cancelLabel: string =
      element.getAttribute('cancel-label') || 'Cancel';
    const doneLabel: string = element.getAttribute('done-label') || 'Done';

    return (
      <Modal
        animationType="slide"
        transparent
        visible={this.state.focused}
        onRequestClose={this.onModalCancel}
      >
        <View style={styles.modalWrapper}>
          <View style={modalStyle}>
            <View style={styles.modalActions}>
              <TouchableWithoutFeedback
                onPressIn={this.toggleCancelPress}
                onPressOut={this.toggleCancelPress}
                onPress={this.onModalCancel}
              >
                <Text style={cancelTextStyle}>{cancelLabel}</Text>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPressIn={this.toggleSavePress}
                onPressOut={this.toggleSavePress}
                onPress={this.onModalDone}
              >
                <Text style={doneTextStyle}>{doneLabel}</Text>
              </TouchableWithoutFeedback>
            </View>
            {this.renderPicker()}
          </View>
        </View>
      </Modal>
    );
  };

  /**
   * On Android, we render a view containing the system picker. Android's system picker opens a modal
   * when pressed so the user can select an option. The selected option gets applied immediately. The user
   * can cancel by hitting the back button or tapping outside of the modal.
   */
  renderAndroid = (): ReactNode => {
    const element: Element = this.props.element;
    const stylesheets: StyleSheets = this.props.stylesheets;
    const options: HvComponentOptions = this.props.options;
    const fieldStyle: StyleSheetType<*> = createStyleProp(
      element,
      stylesheets,
      {
        ...options,
        styleAttr: 'field-style',
      },
    );
    const textStyle: StyleSheetType<*> = createStyleProp(element, stylesheets, {
      ...options,
      styleAttr: 'field-text-style',
    });
    const pickerComponent = this.renderPicker(textStyle);
    return <View style={fieldStyle}>{pickerComponent}</View>;
  };

  renderLabel = (formatter): ReactNode => {
    const element: Element = this.props.element;
    const value: ?Date = this.state.value;
    const stylesheets: StyleSheets = this.props.stylesheets;
    const options: HvComponentOptions = this.props.options;
    const placeholderTextColor: ?DOMString = element.getAttribute(
      'placeholderTextColor',
    );
    const focused: boolean = this.state.focused;
    const pressed: boolean = this.state.fieldPressed;
    const fieldTextStyle = createStyleProp(element, stylesheets, {
      ...options,
      focused,
      pressed,
      styleAttr: 'field-text-style',
    });
    if (!value && placeholderTextColor) {
      fieldTextStyle.push({ color: placeholderTextColor });
    }

    const formatString = element.getAttribute('format');

    const label: string = value
      ? formatter(value, formatString)
      : element.getAttribute('placeholder') || '';

    return <Text style={fieldTextStyle}>{label}</Text>;
  };

  /**
   * On iOS, we render a view containing a text label. Pressing the view opens a modal with a system picker and
   * action buttons along the bottom of the screen. After selecting an option, the user must press the save button.
   * To cancel, the user must press the cancel button.
   */
  renderiOS = (): ReactNode => {
    const element: Element = this.props.element;
    const stylesheets: StyleSheets = this.props.stylesheets;
    const options: HvComponentOptions = this.props.options;
    if (element.getAttribute('hide') === 'true') {
      return null;
    }

    const focused: boolean = this.state.focused;
    const pressed: boolean = this.state.fieldPressed;
    const props = createProps(element, stylesheets, {
      ...options,
      focused,
      pressed,
      styleAttr: 'field-style',
    });

    return (
      <TouchableWithoutFeedback
        onPressIn={this.toggleFieldPress}
        onPressOut={this.toggleFieldPress}
        onPress={this.onFieldPress}
      >
        <View {...props}>
          <FormatDateContext.Consumer>
            {formatter => this.renderLabel(formatter)}
          </FormatDateContext.Consumer>
          {this.renderPickerModal()}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  render(): ReactNode {
    return Platform.OS === 'ios' ? this.renderiOS() : this.renderAndroid();
  }
}
