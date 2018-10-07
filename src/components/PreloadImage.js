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

  setPreloader() {
    const image = new Image();

    image.onload = () => this.setState({
      loaded: true,
      src: `url(${this.props.src})`
    });

    image.src = this.props.src;
  }

  render() {
    return (
        <div className='preload-background img-fluid' role="img" alt={this.props.alt}>
          <div 
            className={this.state.loaded ? 'thumbnail thumbnail-fade-in' : 'thumbnail '} 
            style={this.props.greyOutPost === false ? {backgroundImage: this.state.src} : greyOutStyle}
          />
        </div>
    );
  }
}

const greyOutStyle = {
  backgroundImage: 'linear-gradient(to bottom right,#cccccc,#cccccc)',
	opacity: 0.6
};

export default PreloadImage;