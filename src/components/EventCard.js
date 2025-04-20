import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const EventCard = ({ event }) => {
  const { id, name, img, price, date, location, category } = event;

  return (
    <div className="event-card animate-fadeIn">
      <div className="relative overflow-hidden">
        <img 
          src={img} 
          alt={name} 
          className="event-card-img"
        />
        {category && (
          <span className="absolute top-2 right-2 badge badge-primary">
            {category}
          </span>
        )}
      </div>
      
      <div className="event-card-body">
        <h3 className="event-card-title">{name}</h3>
        
        {date && (
          <div className="flex items-center text-gray-600 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{date}</span>
          </div>
        )}
        
        {location && (
          <div className="flex items-center text-gray-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{location}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3">
          <span className="event-card-price">{price}</span>
          <Link to={`/evento/${id}`}>
            <Button 
              variant="primary" 
              size="sm" 
              outline
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            >
              Ver Detalles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;