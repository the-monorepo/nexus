import React from 'react';
import PropTypes from 'prop-types';
class TestComponent extends React.Component {
  render() {
    return (
      <div>
        {this.props.string}
        {this.props.object}
        {this.props.number}
        {this.props.array}
        {this.props.function}
        {this.props.boolean}
        {this.props.color}
        {this.props.defaultBoolean}
        {this.props.propTypesString}
      </div>
    );
  }
}
TestComponent.defaultProps = {
  defaultBoolean: true,
};

TestComponent.propTypes = {
  propTypesString: PropTypes.string,
};

export { TestComponent };
