import React from 'react';
class TestComponent extends React.Component {
  static defaultProps = {
    defaultBoolean: true,
  };

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

TestComponent.propTypes = {
  propTypesString: PropTypes.string,
};

export { TestComponent };
