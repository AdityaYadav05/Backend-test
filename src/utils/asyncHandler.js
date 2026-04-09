//first way to write async handler method

// const asyncHandler = (fn) =>{
// (req,res,next) => {
//     Promise.resolve(fn(req,res,next)).catch((error)=>next(error));
// }
// }

// export {asyncHandler}

// second way to write async handler method

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {asyncHandler};