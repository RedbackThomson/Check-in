import React from 'react';
import ReactSelect from 'react-select';

export default class StyledSelect<P, S> extends React.Component<P, S> {
  theme = (theme: any) => ({
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#004E74',
    },
  })

  render() {
    return (
      <ReactSelect
        theme={this.theme}
        {...this.props}
      />
    );
  }
}
