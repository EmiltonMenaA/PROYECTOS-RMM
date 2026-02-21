export default function ProgressBar({ 
  percentage = 0, 
  label = 'Progreso', 
  showPercentage = true,
  animate = true,
  color = 'blue' // 'blue', 'green', 'orange', 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  }

  const getBgColor = () => colorClasses[color] || colorClasses.blue

  return (
    <div className="w-full">
      {/* Label */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {showPercentage && (
          <p className="text-sm font-bold text-gray-800">{Math.round(percentage)}%</p>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden h-2">
        {/* Progress Fill */}
        <div
          className={`h-full ${getBgColor()} transition-all duration-300 ${
            animate && percentage < 100 ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Loading Text */}
      {percentage > 0 && percentage < 100 && (
        <p className="text-xs text-gray-500 mt-2">Procesando...</p>
      )}

      {/* Complete Text */}
      {percentage >= 100 && (
        <p className="text-xs text-green-600 font-medium mt-2">✓ Completado</p>
      )}
    </div>
  )
}
