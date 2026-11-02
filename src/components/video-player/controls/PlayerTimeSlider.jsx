import { TimeSlider } from "@vidstack/react";

const PlayerTimeSlider = ({ thumbnails }) => {
  return (
    <TimeSlider.Root className="player-slider player-time-slider" aria-label="Video progress">
      <TimeSlider.Track className="player-slider-track">
        <TimeSlider.Progress className="player-slider-progress" />
        <TimeSlider.TrackFill className="player-slider-fill" />
      </TimeSlider.Track>
      <TimeSlider.Thumb className="player-slider-thumb" />
      {/* CSS follows the slider pointer without deferred placement work after unmount. */}
      <div className="player-time-preview" data-thumbnails={Boolean(thumbnails) || undefined} aria-hidden="true">
        {thumbnails && <TimeSlider.Thumbnail src={thumbnails} className="player-time-thumbnail" />}
        <TimeSlider.Value className="player-time-preview-value" />
      </div>
    </TimeSlider.Root>
  );
};

export default PlayerTimeSlider;
