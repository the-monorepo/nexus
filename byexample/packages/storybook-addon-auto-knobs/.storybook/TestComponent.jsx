import React from 'react';
import PropTypes from 'prop-types';

class TestComponent extends React.Component {
  render() {
    return (
      <div>
        {Object.keys(this.props).map((key, index) => (
          <p key={index}>{`${key}: ${this.props[key]}`}</p>
        ))}
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
