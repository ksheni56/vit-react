import React from 'react';

class PreloadImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      src: null
    };
  }

  componentDidMount() {
    this.setPreloader()
  }

  componentWillUnmount() {
    this.image.onload = null
  }

  setPreloader() {
    this.image = new Image();

    this.image.onload = () => this.setState({
      loaded: true,
      src: `url('${this.props.src}')`
    });

    this.image.src = this.props.src;
  }

  render() {
    return (
      <div className='preload-background img-fluid' role="img" alt={this.props.alt}>
        <div className={this.state.loaded ? 'thumbnail thumbnail-fade-in' : 'thumbnail '} style={{
          backgroundImage: this.state.src
        }} />
      </div>
    );
  }
}

export default PreloadImage;