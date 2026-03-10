"""
Minimal PyAV compatibility shim for environments where PyAV wheels are not
available. This is sufficient for MusicGen prompt inference path.
"""


class AVError(Exception):
    pass


class _Logging:
    ERROR = 40

    @staticmethod
    def set_level(_level):
        return None


class _VideoFrame:
    pict_type = "NONE"

    @staticmethod
    def from_ndarray(*_args, **_kwargs):
        raise AVError("PyAV VideoFrame is not available in shim mode.")


class _AudioFrame:
    @staticmethod
    def from_ndarray(*_args, **_kwargs):
        raise AVError("PyAV AudioFrame is not available in shim mode.")


class _VideoModule:
    class frame:
        VideoFrame = _VideoFrame


logging = _Logging()
video = _VideoModule()
AudioFrame = _AudioFrame
VideoFrame = _VideoFrame


def open(*_args, **_kwargs):  # noqa: A001
    raise AVError(
        "PyAV runtime is unavailable. Install a compatible PyAV build if you "
        "need video/audio container decoding."
    )
